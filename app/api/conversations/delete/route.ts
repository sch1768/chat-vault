import { NextRequest, NextResponse } from 'next/server';
import { deleteConversationsFromStorage } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '삭제할 대화 ID 목록이 필요합니다.' }, { status: 400 });
    }

    await deleteConversationsFromStorage(ids);

    return NextResponse.json({
      success: true,
      deletedIds: ids,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '대화 삭제 중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
