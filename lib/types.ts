export interface Turn {
  id?: string;
  speaker: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ParsedConversation {
  title: string;
  sourceUrl?: string;
  sourceType: 'chatgpt' | 'gemini' | 'raw';
  turns: Turn[];
  fullMarkdown: string;
}

export interface ConversationSummary {
  title: string;
  summary3Lines: string[];
  tags: string[];
}

export interface ConversationRecord {
  id: string;
  title: string;
  original_url?: string;
  source_type: 'chatgpt' | 'gemini' | 'raw';
  summary_3lines: string[];
  tags: string[];
  full_markdown: string;
  turn_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationChunk {
  id: string;
  conversation_id: string;
  chunk_index: number;
  content: string;
  speaker: 'user' | 'assistant' | 'system';
  similarity?: number;
}

export interface RagChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  sources?: { content: string; similarity: number }[];
}
