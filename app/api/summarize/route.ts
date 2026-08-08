import { NextRequest, NextResponse } from 'next/server';
import { generateConversationSummary } from '@/lib/gemini';
import { Turn } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { turns, title } = await req.json();

    if (!turns || !Array.isArray(turns)) {
      return NextResponse.json({ error: '유효한 대화 데이터(turns)가 필요합니다.' }, { status: 400 });
    }

    const summary = await generateConversationSummary(turns as Turn[], title);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '요약 생성 도중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
