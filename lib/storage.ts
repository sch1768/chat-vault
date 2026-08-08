import { createClient } from '@supabase/supabase-js';
import { ConversationChunk, ConversationRecord, ParsedConversation } from './types';
import { generateEmbedding } from './gemini';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Clean trailing slashes or path suffixes that cause PGRST125
const supabaseUrl = rawSupabaseUrl ? rawSupabaseUrl.replace(/\/+$|\/(v1|rest\/v1)\/?$/gi, '').trim() : '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// In-Memory Storage Fallback if Supabase is not yet configured
let memoryConversations: ConversationRecord[] = [];
let memoryChunks: (ConversationChunk & { embedding: number[] })[] = [];

/**
 * Save conversation and chunk embeddings to Supabase (or memory fallback)
 */
export async function saveConversationToStorage(
  parsed: ParsedConversation,
  summary3Lines: string[],
  tags: string[]
): Promise<string> {
  const conversationId = crypto.randomUUID();
  const now = new Date().toISOString();

  const record: ConversationRecord = {
    id: conversationId,
    title: parsed.title,
    original_url: parsed.sourceUrl,
    source_type: parsed.sourceType,
    summary_3lines: summary3Lines,
    tags,
    full_markdown: parsed.fullMarkdown,
    turn_count: parsed.turns.length,
    created_at: now,
    updated_at: now,
  };

  // Chunking turns for RAG
  const chunksToSave: {
    conversation_id: string;
    chunk_index: number;
    content: string;
    speaker: 'user' | 'assistant' | 'system';
    embedding: number[];
  }[] = [];

  for (let i = 0; i < parsed.turns.length; i++) {
    const turn = parsed.turns[i];
    const embedding = await generateEmbedding(turn.content);
    chunksToSave.push({
      conversation_id: conversationId,
      chunk_index: i,
      content: turn.content,
      speaker: turn.speaker,
      embedding,
    });
  }

  if (supabase) {
    // Insert into Supabase
    const { error: convErr } = await supabase.from('conversations').insert([record]);

    if (convErr) {
      console.error('Supabase conversation insert error:', convErr);
      throw new Error(`Supabase 저장 실패: ${convErr.message} (코드: ${convErr.code})`);
    }

    const { error: chunkErr } = await supabase.from('conversation_chunks').insert(chunksToSave);
    if (chunkErr) {
      console.error('Supabase chunks insert error:', chunkErr);
      throw new Error(`Supabase 조각 저장 실패: ${chunkErr.message}`);
    }

    return conversationId;
  }

  // Fallback to memory storage
  memoryConversations.unshift(record);
  for (const c of chunksToSave) {
    memoryChunks.push({
      id: crypto.randomUUID(),
      ...c,
    });
  }

  return conversationId;
}

/**
 * List all saved conversations
 */
export async function getConversationsList(): Promise<ConversationRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as ConversationRecord[];
    }
  }

  return memoryConversations;
}

/**
 * Get single conversation by ID
 */
export async function getConversationById(id: string): Promise<ConversationRecord | null> {
  if (supabase) {
    const { data, error } = await supabase.from('conversations').select('*').eq('id', id).single();

    if (!error && data) {
      return data as ConversationRecord;
    }
  }

  return memoryConversations.find((c) => c.id === id) || null;
}

/**
 * Vector Search relevant chunks for RAG Q&A
 */
export async function searchRelevantChunks(
  conversationId: string,
  queryEmbedding: number[],
  topK: number = 4
): Promise<{ speaker: 'user' | 'assistant' | 'system'; content: string; similarity: number }[]> {
  if (supabase) {
    const { data, error } = await supabase.rpc('match_conversation_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: topK,
      filter_conversation_id: conversationId,
    });

    if (!error && data) {
      return data.map((d: { speaker: string; content: string; similarity: number }) => ({
        speaker: d.speaker as 'user' | 'assistant' | 'system',
        content: d.content,
        similarity: d.similarity,
      }));
    }
  }

  // Memory Cosine Similarity Search Fallback
  const filtered = memoryChunks.filter((c) => c.conversation_id === conversationId);
  const scored = filtered.map((c) => {
    const similarity = cosineSimilarity(queryEmbedding, c.embedding);
    return {
      speaker: c.speaker,
      content: c.content,
      similarity,
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Delete selected conversations and their chunks from Supabase or memory fallback
 */
export async function deleteConversationsFromStorage(ids: string[]): Promise<boolean> {
  if (supabase) {
    const { error: chunkErr } = await supabase.from('conversation_chunks').delete().in('conversation_id', ids);
    if (chunkErr) console.error('Supabase chunk delete error:', chunkErr);

    const { error: convErr } = await supabase.from('conversations').delete().in('id', ids);
    if (convErr) console.error('Supabase conversation delete error:', convErr);

    return !convErr;
  }

  memoryConversations = memoryConversations.filter((c) => !ids.includes(c.id));
  memoryChunks = memoryChunks.filter((c) => !ids.includes(c.conversation_id));
  return true;
}
