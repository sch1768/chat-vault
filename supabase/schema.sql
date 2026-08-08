# Supabase Database Schema for AI Conversation Knowledge Manager

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Conversations Table (Relational Metadata & Summary)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_url TEXT,
    source_type TEXT NOT NULL DEFAULT 'chatgpt', -- 'chatgpt', 'gemini', 'raw'
    summary_3lines TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    full_markdown TEXT NOT NULL,
    turn_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Document Chunks Table (Vector Embeddings for RAG)
CREATE TABLE IF NOT EXISTS public.conversation_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    speaker TEXT, -- 'user', 'assistant', 'system'
    embedding vector(768), -- Gemini text-embedding-004 output dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create HNSW or IVFFlat Index for fast Vector Similarity Search
CREATE INDEX IF NOT EXISTS conversation_chunks_embedding_idx 
ON public.conversation_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. RPC Function for Match Vectors (RAG Semantic Search)
CREATE OR REPLACE FUNCTION match_conversation_chunks(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_conversation_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    conversation_id uuid,
    chunk_index int,
    content text,
    speaker text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.conversation_id,
        cc.chunk_index,
        cc.content,
        cc.speaker,
        1 - (cc.embedding <=> query_embedding) AS similarity
    FROM public.conversation_chunks cc
    WHERE 
        (filter_conversation_id IS NULL OR cc.conversation_id = filter_conversation_id)
        AND 1 - (cc.embedding <=> query_embedding) > match_threshold
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
