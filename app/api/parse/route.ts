import { NextRequest, NextResponse } from 'next/server';
import { parseSharedLinkOrText } from '@/lib/parser';

export async function POST(req: NextRequest) {
  try {
    const { urlOrText } = await req.json();

    if (!urlOrText || typeof urlOrText !== 'string') {
      return NextResponse.json({ error: '유효한 URL 또는 마크다운 텍스트를 입력해 주세요.' }, { status: 400 });
    }

    const parsed = await parseSharedLinkOrText(urlOrText);

    return NextResponse.json({
      success: true,
      parsed,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '파싱 도중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
