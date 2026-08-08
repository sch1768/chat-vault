import { NextResponse } from 'next/server';
import { getConversationsList } from '@/lib/storage';

export async function GET() {
  try {
    const list = await getConversationsList();
    return NextResponse.json({
      success: true,
      conversations: list,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '목록 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
