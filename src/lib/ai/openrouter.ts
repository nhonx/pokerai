import { TableState } from "../poker/types";
import { AIPersona, AI_PERSONAS } from "./personas";
import { buildAIPrompt, AIDecisionOutput } from "./prompt";
import { getLocalFallbackDecision } from "./fallback";
import { getValidActions } from "../poker/engine";
import { RECOMMENDED_MODELS, OpenRouterModel } from "./models";
export { RECOMMENDED_MODELS, type OpenRouterModel };

export interface OpenRouterResult {
  decision: AIDecisionOutput;
  trace: {
    systemPrompt: string;
    userPrompt: string;
    httpStatus?: number;
    latencyMs: number;
    rawResponse?: string;
    parsedDecision: AIDecisionOutput;
    error?: string;
    isFallback: boolean;
  };
}

/**
 * Robustly parses and extracts JSON from various LLM response formats
 * (strips reasoning <think> blocks, markdown code blocks, handles trailing content).
 */
export function extractJSONFromContent(content: string): any {
  if (!content || typeof content !== 'string') {
    throw new Error('Empty or non-string response content');
  }

  // 1. Remove reasoning / thinking tags (e.g. DeepSeek-R1 / Nemotron <think>...</think>)
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Remove markdown code fences if present
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 3. Try standard parse
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 4. Try regex extract for outer { ... }
  const jsonObjectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[0]);
    } catch {}
  }

  throw new Error(`Failed to parse valid JSON from content: "${content.substring(0, 120)}..."`);
}

/**
 * Validates and sanitizes LLM decision to guarantee it complies with poker rules.
 */
function sanitizeDecision(
  rawDecision: any,
  state: TableState,
  playerIndex: number,
  persona: AIPersona
): AIDecisionOutput {
  const valid = getValidActions(state, playerIndex);
  const player = state.players[playerIndex];

  let action = String(rawDecision?.action || '').toUpperCase();
  let amount = Number(rawDecision?.amount) || 0;

  if (action === 'CHECK' && !valid.canCheck) {
    action = valid.canCall ? 'CALL' : 'FOLD';
    amount = valid.callAmount;
  }

  if (action === 'CALL') {
    amount = valid.callAmount;
  }

  if (action === 'BET') {
    if (!valid.canBet) {
      action = valid.canRaise ? 'RAISE' : valid.canCall ? 'CALL' : 'CHECK';
      amount = valid.minRaise;
    } else {
      amount = Math.max(valid.minBet, Math.min(valid.maxBet, amount));
    }
  }

  if (action === 'RAISE') {
    if (!valid.canRaise) {
      action = valid.canCall ? 'CALL' : 'FOLD';
      amount = valid.callAmount;
    } else {
      amount = Math.max(valid.minRaise, Math.min(valid.maxRaise, amount));
    }
  }

  if (action === 'ALL_IN') {
    amount = player.chips;
  }

  if (!['FOLD', 'CHECK', 'CALL', 'BET', 'RAISE', 'ALL_IN'].includes(action)) {
    action = valid.canCheck ? 'CHECK' : 'FOLD';
    amount = 0;
  }

  return {
    action: action as any,
    amount,
    confidence: typeof rawDecision?.confidence === 'number' ? rawDecision.confidence : 0.8,
    internal_reasoning:
      rawDecision?.internal_reasoning ||
      `${persona.name} makes a move based on table position and pot odds.`,
    table_talk:
      rawDecision?.table_talk ||
      persona.sampleQuotes[Math.floor(Math.random() * persona.sampleQuotes.length)],
  };
}

/**
 * Requests a poker action from OpenRouter API, with automatic fallback on failure or missing key.
 */
export async function getAIDecisionWithTrace(
  state: TableState,
  playerIndex: number,
  apiKey?: string,
  model: string = 'nvidia/nemotron-3-ultra-550b-a55b:free',
  memoryContext?: string,
  reasoningEffort: import('../poker/types').ReasoningEffort = 'low'
): Promise<OpenRouterResult> {
  const startTime = Date.now();
  const player = state.players[playerIndex];
  const persona = (player.personaId && AI_PERSONAS[player.personaId]) || AI_PERSONAS.shark;

  const { system, user } = buildAIPrompt(state, playerIndex, persona, memoryContext);

  // If no API key provided, immediately use local fallback
  if (!apiKey || apiKey.trim() === '') {
    const fallbackDecision = getLocalFallbackDecision(state, playerIndex, persona, false);
    return {
      decision: fallbackDecision,
      trace: {
        systemPrompt: system,
        userPrompt: user,
        latencyMs: Date.now() - startTime,
        parsedDecision: fallbackDecision,
        error: 'OPENROUTER_API_KEY is not configured in environment; using local heuristic engine.',
        isFallback: true,
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout as requested

    // Configure reasoning effort based on UI settings
    const reasoningPayload =
      reasoningEffort === 'none'
        ? { max_tokens: 0 }
        : { effort: reasoningEffort };

    const maxTokens =
      reasoningEffort === 'high' ? 800 : reasoningEffort === 'medium' ? 400 : 220;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://pokerai.local',
        'X-Title': 'Texas Holdem AI Agent',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.6,
        max_tokens: maxTokens,
        reasoning: reasoningPayload,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`OpenRouter HTTP ${response.status}: ${errText}`);
      const isTimeout = latencyMs >= 29000;
      const fallbackDecision = getLocalFallbackDecision(state, playerIndex, persona, isTimeout);
      return {
        decision: fallbackDecision,
        trace: {
          systemPrompt: system,
          userPrompt: user,
          httpStatus: response.status,
          latencyMs,
          rawResponse: errText,
          parsedDecision: fallbackDecision,
          error: `OpenRouter HTTP ${response.status}: ${errText}`,
          isFallback: true,
        },
      };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    let parsed: any;
    try {
      parsed = extractJSONFromContent(rawContent);
    } catch (parseError: any) {
      console.warn('JSON parsing error on model output:', parseError);
      const fallbackDecision = getLocalFallbackDecision(state, playerIndex, persona, false);
      return {
        decision: fallbackDecision,
        trace: {
          systemPrompt: system,
          userPrompt: user,
          httpStatus: response.status,
          latencyMs,
          rawResponse: rawContent,
          parsedDecision: fallbackDecision,
          error: `JSON parse failure: ${parseError.message}`,
          isFallback: true,
        },
      };
    }

    const sanitized = sanitizeDecision(parsed, state, playerIndex, persona);

    return {
      decision: sanitized,
      trace: {
        systemPrompt: system,
        userPrompt: user,
        httpStatus: response.status,
        latencyMs,
        rawResponse: rawContent,
        parsedDecision: sanitized,
        isFallback: false,
      },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = err?.name === 'AbortError' || latencyMs >= 29000;
    console.warn(
      `OpenRouter API request failed (timeout=${isTimeout}), executing local heuristic:`,
      err?.message || err
    );
    const fallbackDecision = getLocalFallbackDecision(state, playerIndex, persona, isTimeout);
    return {
      decision: fallbackDecision,
      trace: {
        systemPrompt: system,
        userPrompt: user,
        latencyMs,
        parsedDecision: fallbackDecision,
        error: isTimeout ? 'Timeout (30s limit exceeded)' : `Exception: ${err?.message || String(err)}`,
        isFallback: true,
      },
    };
  }
}

/**
 * Backward compatibility wrapper returning just AIDecisionOutput.
 */
export async function getAIDecision(
  state: TableState,
  playerIndex: number,
  apiKey?: string,
  model?: string,
  memoryContext?: string
): Promise<AIDecisionOutput> {
  const result = await getAIDecisionWithTrace(state, playerIndex, apiKey, model, memoryContext);
  return result.decision;
}
