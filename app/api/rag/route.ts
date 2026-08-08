import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, generateRagAnswer } from '@/lib/gemini';
import { searchRelevantChunks, getConversationById } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, query, model } = await req.json();

    if (!conversationId || !query) {
      return NextResponse.json({ error: '대화 ID와 질문 내용이 필요합니다.' }, { status: 400 });
    }

    // 1. Generate Query Vector Embedding
    const queryEmbedding = await generateEmbedding(query);

    // 2. Vector Cosine Similarity Search
    const relevantChunks = await searchRelevantChunks(conversationId, queryEmbedding, 4);

    // Fetch conversation for fallback
    const conversation = await getConversationById(conversationId);

    // 3. Generate RAG Response with selected Model
    const answer = await generateRagAnswer(query, relevantChunks, conversation?.full_markdown, model);

    return NextResponse.json({
      success: true,
      answer,
      sources: relevantChunks.map((c) => ({
        content: c.content,
        similarity: c.similarity,
      })),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'RAG 질의응답 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
