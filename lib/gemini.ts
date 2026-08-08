import { GoogleGenAI } from '@google/genai';
import { ConversationSummary, Turn } from './types';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generate 3-line Summary, Title, and Tags using Gemini Flash
 */
export async function generateConversationSummary(
  turns: Turn[],
  existingTitle?: string
): Promise<ConversationSummary> {
  if (!apiKey) {
    // Fallback if API key is not configured yet
    return {
      title: existingTitle || 'AI Conversation Note',
      summary3Lines: [
        '대화 내용을 파싱하여 지식 저장소에 등록했습니다.',
        'Gemini API Key를 .env 파일에 추가하면 자동 요약이 활성화됩니다.',
        '자유롭게 검색 및 RAG 추가 질의응답을 진행해보세요.',
      ],
      tags: ['#AI대화', '#기록'],
    };
  }

  const conversationText = turns
    .map((t) => `${t.speaker.toUpperCase()}: ${t.content}`)
    .join('\n\n')
    .slice(0, 15000); // Limit token size for fast response

  const prompt = `
다음은 유저와 AI가 나눈 대화 내용입니다. 이 대화를 바탕으로 아래 JSON 형식으로 응답해 주세요.

[요구사항]
1. title: 대화의 핵심 주제를 요약하는 명확하고 직관적인 제목 (한국어, 15자 내외). 절대 "Untitled"나 "대화 노트"처럼 성의없는 제목을 쓰지 말 것.
2. summary3Lines: 대화 내용 요약 3줄 배열
   - [첫번째 문장 필수]: 대화를 통해 유저가 얻어낸 가장 핵심적인 결론/정답/추천 1줄을 명확하게 요약할 것.
   - [두번째/세번째 문장]: 세부 분류, 주의사항 또는 주요 조리법/팁 요약.
3. tags: 대화의 키워드 태그 2~4개 배열 (예: ["#요리", "#레시피", "#밀키트"])

[응답 형식 - 반드시 JSON만 출력]:
{
  "title": "대화 제목",
  "summary3Lines": ["첫번째 요약 문장", "두번째 요약 문장", "세번째 요약 문장"],
  "tags": ["#태그1", "#태그2"]
}

[대화 내용]:
${conversationText}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemma-4-31b-it',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);

    return {
      title: parsed.title || existingTitle || 'AI 대화 보관함',
      summary3Lines: Array.isArray(parsed.summary3Lines) ? parsed.summary3Lines : ['요약 데이터를 생성했습니다.'],
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['#지식보관'],
    };
  } catch (err) {
    console.error('Gemini summary generation failed:', err);
    return {
      title: existingTitle || '대화 수집 노트',
      summary3Lines: ['대화 요약 생성 중 오류가 발생했습니다.', '원본 대화는 온전히 보관되었습니다.'],
      tags: ['#대화기록'],
    };
  }
}

/**
 * Generate 768-dim Vector Embedding using Gemini gemini-embedding-001
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!apiKey) {
    // Return dummy 768-length vector if no key provided
    return new Array(768).fill(0.01);
  }

  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text.slice(0, 2048),
    });

    const resObj = response as unknown as { embedding?: { values: number[] }; embeddings?: { values: number[] }[] };
    return resObj.embedding?.values || resObj.embeddings?.[0]?.values || new Array(768).fill(0.01);
  } catch (err) {
    console.error('Gemini embedding failed:', err);
    return new Array(768).fill(0.01);
  }
}

/**
 * Answer RAG Query with retrieved context chunks using Gemini
 */
export async function generateRagAnswer(
  query: string,
  contextChunks: { speaker: string; content: string }[]
): Promise<string> {
  if (!apiKey) {
    return 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel 환경변수나 .env.local 파일에 설정해 주세요.';
  }

  const contextText = contextChunks
    .map((c, i) => `[참고 맥락 ${i + 1} (${c.speaker})]:\n${c.content}`)
    .join('\n\n');

  const prompt = `
당신은 사용자의 지난 AI 대화 기록을 바탕으로 질문에 정확하고 환각 없이 답변하는 지식 보조 AI입니다.

아래 주어진 [참고 맥락]을 최우선으로 사용하여 사용자의 [질문]에 답변해 주세요.
참고 맥락에 없는 내용에 대해서는 솔직하게 "지정된 대화 기록에서는 확인되지 않는 내용입니다"라고 안내하세요.

[참고 맥락]:
${contextText}

[사용자 질문]:
${query}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemma-4-31b-it',
      contents: prompt,
    });

    return response.text || '답변을 생성하지 못했습니다.';
  } catch (err) {
    console.error('Gemini RAG answer failed:', err);
    return 'RAG 답변 생성 중 오류가 발생했습니다.';
  }
}
