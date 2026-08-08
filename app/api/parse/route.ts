import { NextRequest, NextResponse } from 'next/server';
import { parseSharedLinkOrText } from '@/lib/parser';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function POST(req: NextRequest) {
  try {
    const { urlOrText } = await req.json();

    if (!urlOrText || typeof urlOrText !== 'string') {
      return NextResponse.json({ error: '유효한 URL 또는 마크다운 텍스트를 입력해 주세요.' }, { status: 400 });
    }

    const parsed = await parseSharedLinkOrText(urlOrText);

    // If Gemini shared link hid the user question (no 'user' turn present), use Gemma AI to infer question & title
    const hasUserTurn = parsed.turns.some((t) => t.speaker === 'user');
    if (!hasUserTurn && ai && parsed.turns.length > 0) {
      try {
        const prompt = `
아래는 유저의 질문이 생략된 채 공유된 AI 대화 답변 내용입니다.
이 답변 내용을 바탕으로 유저가 당초 입력했을 **원래 유저 질문 1문장**과 **직관적인 대화 제목(15자 내외)**을 추론하여 JSON 형식으로 출력해 주세요.

[AI 답변 내용]:
${parsed.turns[0].content.slice(0, 3000)}

[응답 형식 - 반드시 JSON만 출력]:
{
  "userQuestion": "유저가 입력한 원래 질문 1문장",
  "title": "추론된 대화 제목"
}
`;

        const res = await ai.models.generateContent({
          model: 'gemma-4-31b-it',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const data = JSON.parse(res.text || '{}');
        if (data.userQuestion) {
          parsed.turns.unshift({ speaker: 'user', content: data.userQuestion });
        }
        if (data.title && (!parsed.title || parsed.title === 'Untitled AI Conversation' || /direct access/i.test(parsed.title))) {
          parsed.title = data.title;
        }

        // Rebuild full markdown
        parsed.fullMarkdown = parsed.turns.map((t) => `### ${t.speaker === 'user' ? 'User' : 'Assistant'}\n${t.content}`).join('\n\n');
      } catch (inferErr) {
        console.warn('User question inference failed:', inferErr);
      }
    }

    return NextResponse.json({
      success: true,
      parsed,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '파싱 도중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
