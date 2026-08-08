import { NextRequest, NextResponse } from 'next/server';
import { getConversationById } from '@/lib/storage';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conversation = await getConversationById(id);

    if (!conversation) {
      return NextResponse.json({ error: '해당 대화 기록을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '대화 상세 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
