import { NextRequest, NextResponse } from 'next/server';
import { getAIDecisionWithTrace } from '@/lib/ai/openrouter';
import { TableState } from '@/lib/poker/types';
import {
  recordTableStateToFile,
  getTableMemoryContext,
  logAIDecisionToFile,
  ensureTableDir,
} from '@/lib/server/tableMemory';

const DEFAULT_BACKEND_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { state, playerIndex } = body as {
      state: TableState;
      playerIndex: number;
    };

    if (!state || playerIndex === undefined || !state.players[playerIndex]) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters: state, playerIndex' },
        { status: 400 }
      );
    }

    const player = state.players[playerIndex];

    // Ensure folder inprogress/<tableId>/ exists
    ensureTableDir(state.id);

    // Persist current table state & update player behavior statistics
    recordTableStateToFile(state);

    // Read the file-based memory context for this table to inject into AI prompt
    const memoryContext = getTableMemoryContext(state.id);

    // AI model is determined by the player's assigned model, or default
    const modelToUse = player.model || DEFAULT_BACKEND_MODEL;

    // AI API key is loaded from backend environment variable
    const apiKey = process.env.OPENROUTER_API_KEY || '';

    // Execute decision with full trace metadata
    const result = await getAIDecisionWithTrace(state, playerIndex, apiKey, modelToUse, memoryContext);

    // Write trace and response to inprogress/<tableId>/<playerName>.log
    logAIDecisionToFile({
      timestamp: new Date().toISOString(),
      tableId: state.id,
      handCount: state.handCount,
      street: state.phase,
      player,
      modelUsed: modelToUse,
      systemPrompt: result.trace.systemPrompt,
      userPrompt: result.trace.userPrompt,
      httpStatus: result.trace.httpStatus,
      latencyMs: result.trace.latencyMs,
      rawResponse: result.trace.rawResponse,
      parsedDecision: result.decision,
      error: result.trace.error,
      isFallback: result.trace.isFallback,
    });

    return NextResponse.json({ decision: result.decision });
  } catch (error: any) {
    console.error('API /api/ai/decide error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
