import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Info } from 'lucide-react';
import { RagChatMessage } from '@/lib/types';

interface RagChatProps {
  conversationId: string;
}

export const RagChat: React.FC<RagChatProps> = ({ conversationId }) => {
  const [messages, setMessages] = useState<RagChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        '안녕하세요! 저장된 이 대화 기록에 대해 궁금한 점을 질문해 보세요. 관련 대화 문단을 검색하여 환각 없이 알려드립니다.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    const userMsg: RagChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: userQuery,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          query: userQuery,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'RAG 답변 생성 실패');

      const botMsg: RagChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          content: `⚠️ ${errorMsg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">RAG 이어가기 채팅</h3>
            <p className="text-xs text-slate-400">저장된 대화 맥락(Vector Search) 기반 질의응답</p>
          </div>
        </div>
      </div>

      {/* RAG Warning Tooltip */}
      <div className="flex items-center gap-2 bg-indigo-950/40 px-4 py-2 text-xs text-indigo-300 border-b border-indigo-900/40">
        <Info className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
        <span>⚠️ 대용량 첨부파일 내부 텍스트는 RAG 검색 대상에서 제외될 수 있습니다 (대화 텍스트 맥락은 유지됨).</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-2`}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>

              {/* RAG Source Context Highlights */}
              {msg.sources && msg.sources.length > 0 && (
                <details className="text-xs text-slate-400 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
                  <summary className="cursor-pointer font-semibold hover:text-indigo-400 transition flex items-center gap-1">
                    🔍 참고한 대화 맥락 ({msg.sources.length}개)
                  </summary>
                  <div className="mt-2 space-y-1.5 pt-1 border-t border-slate-800">
                    {msg.sources.map((src, i) => (
                      <div key={i} className="text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800">
                        <span className="text-indigo-400 font-bold">[{i + 1}] </span>
                        {src.content}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white text-xs">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <span>Gemini RAG 맥락 분석 및 답변 생성 중...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 border border-slate-800 focus-within:border-indigo-500 transition">
          <input
            type="text"
            placeholder="대화 내용에 대해 이어서 질문해 보세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 active:scale-95 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
