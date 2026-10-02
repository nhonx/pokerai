import { NextRequest, NextResponse } from 'next/server';
import { TableState } from '@/lib/poker/types';
import { recordTableStateToFile, ensureTableDir } from '@/lib/server/tableMemory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { state } = body as { state: TableState };

    if (!state || !state.id) {
      return NextResponse.json({ error: 'Missing table state or id' }, { status: 400 });
    }

    try {
      ensureTableDir(state.id);
      recordTableStateToFile(state);
    } catch (fsErr) {
      console.warn('Non-fatal: Unable to record table state to filesystem:', fsErr);
    }

    return NextResponse.json({ success: true, tableId: state.id });
  } catch (error: any) {
    console.error('API /api/table/record error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record table state' },
      { status: 500 }
    );
  }
}
