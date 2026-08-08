import { NextRequest, NextResponse } from 'next/server';
import { saveConversationToStorage } from '@/lib/storage';
import { ParsedConversation } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { parsed, summary3Lines, tags } = await req.json();

    if (!parsed || !parsed.turns) {
      return NextResponse.json({ error: '저장할 파싱 데이터가 필요합니다.' }, { status: 400 });
    }

    const conversationId = await saveConversationToStorage(
      parsed as ParsedConversation,
      summary3Lines || [],
      tags || []
    );

    return NextResponse.json({
      success: true,
      id: conversationId,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '저장 및 임베딩 인덱싱 중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
