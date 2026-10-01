import { NextResponse } from 'next/server';
import { RECOMMENDED_MODELS } from '@/lib/ai/openrouter';

export async function GET() {
  return NextResponse.json({
    models: RECOMMENDED_MODELS,
  });
}
