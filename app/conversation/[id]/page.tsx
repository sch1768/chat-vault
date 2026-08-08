'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ConversationRecord } from '@/lib/types';
import { RagChat } from '@/components/RagChat';
import { ArrowLeft, ExternalLink, Calendar, Hash, MessageSquare, Sparkles, Copy, Check } from 'lucide-react';

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/conversations/${id}`);
        const data = await res.json();
        if (data.conversation) {
          setConversation(data.conversation);
        }
      } catch (err) {
        console.error('Failed to fetch conversation detail:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleCopyMarkdown = () => {
    if (!conversation) return;
    navigator.clipboard.writeText(conversation.full_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <p className="text-sm font-semibold animate-pulse">대화 기록 불러오는 중...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 p-4 text-center">
        <h2 className="text-lg font-bold text-white">대화 기록을 찾을 수 없습니다.</h2>
        <Link href="/" className="mt-4 text-xs font-semibold text-indigo-400 hover:underline">
          ← 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 uppercase">
                {conversation.source_type}
              </span>
              <h1 className="text-base font-bold text-white line-clamp-1">{conversation.title}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? '복사됨!' : '마크다운 복사'}</span>
          </button>

          {conversation.original_url && (
            <a
              href={conversation.original_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition"
            >
              <span>원본 공유 링크</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </header>

      {/* Main Split View: Left (Original Markdown Viewer), Right (RAG Chat) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {/* Left Column: Summary & Parsed Conversation Viewer */}
        <section className="lg:col-span-7 space-y-6">
          {/* Summary Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Gemini AI 3줄 핵심 요약</h3>
            </div>
            <div className="space-y-2 rounded-xl bg-slate-950 p-4 border border-slate-800">
              {conversation.summary_3lines.map((line, idx) => (
                <p key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{line}</span>
                </p>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {conversation.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400"
                >
                  <Hash className="h-3 w-3 text-indigo-400" />
                  {tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          </div>

          {/* Full Conversation Markdown Viewer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              <span>파싱된 원본 대화 내용 ({conversation.turn_count} 턴)</span>
            </h3>

            <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4 font-mono overflow-x-auto max-h-[600px] overflow-y-auto pr-2">
              {conversation.full_markdown.split('\n\n').map((block, i) => {
                if (block.startsWith('### User')) {
                  return (
                    <div key={i} className="rounded-xl bg-indigo-950/30 p-4 border border-indigo-900/40">
                      <span className="text-xs font-bold text-indigo-400 block mb-1">👤 User</span>
                      <div className="whitespace-pre-wrap text-slate-200">{block.replace(/^### User\n?/, '')}</div>
                    </div>
                  );
                } else if (block.startsWith('### Assistant')) {
                  return (
                    <div key={i} className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                      <span className="text-xs font-bold text-purple-400 block mb-1">🤖 Assistant</span>
                      <div className="whitespace-pre-wrap text-slate-300">{block.replace(/^### Assistant\n?/, '')}</div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="whitespace-pre-wrap text-slate-300">
                    {block}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: RAG Chat Integration */}
        <section className="lg:col-span-5 h-[650px] sticky top-20">
          <RagChat conversationId={conversation.id} />
        </section>
      </main>
    </div>
  );
}
