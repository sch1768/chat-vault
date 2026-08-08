'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ConversationRecord } from '@/lib/types';
import { RagChat } from '@/components/RagChat';
import { Navbar } from '@/components/Navbar';
import { ImportModal } from '@/components/ImportModal';
import {
  ExternalLink,
  Hash,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
} from 'lucide-react';

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isOriginalOpen, setIsOriginalOpen] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/conversations/${id}`);
        const data = await res.json();
        if (data.conversation) {
          setConversation(data.conversation);
          setTitleInput(data.conversation.title);
        }
      } catch (err) {
        console.error('Failed to fetch conversation detail:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleSaveTitle = async () => {
    if (!titleInput.trim() || !conversation) return;
    try {
      const res = await fetch(`/api/conversations/${id}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleInput.trim() }),
      });
      if (res.ok) {
        setConversation({ ...conversation, title: titleInput.trim() });
      }
    } catch (err) {
      console.error('Failed to save title:', err);
    } finally {
      setIsEditingTitle(false);
    }
  };

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
    <div
      className={`min-h-screen flex flex-col bg-slate-950 text-slate-100 ${
        fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
      }`}
    >
      {/* Standard Fixed Navbar with Settings & Register Link buttons */}
      <Navbar
        onOpenImportModal={() => setIsImportModalOpen(true)}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />

      {/* Main Split View */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {/* Left Column: Metadata Header, Summary & Parsed Conversation Viewer */}
        <section className="lg:col-span-7 space-y-6">
          {/* Sub Header: Source Badge, Editable Title, Short Share Link */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                {/* Source Badge with Clean Color */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    conversation.source_type === 'chatgpt'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : conversation.source_type === 'gemini'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}
                >
                  <span>{conversation.source_type}</span>
                </span>
              </div>

              {/* Short Link Button */}
              {conversation.original_url && (
                <a
                  href={conversation.original_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                  <span>원문 보기</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              )}
            </div>

            {/* Editable Title Section (16px font-size for iOS auto-zoom prevention) */}
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="flex-1 rounded-xl border border-indigo-500 bg-slate-950 px-3 py-2 text-base text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setTitleInput(conversation.title);
                      setIsEditingTitle(false);
                    }}
                    className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 group">
                  <h2 className="text-lg font-bold text-white leading-snug">{conversation.title}</h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    title="제목 수정"
                    className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-300 transition shrink-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Gemma AI 핵심 요약 & 결론</h3>
            </div>
            <div className="space-y-2.5 rounded-xl bg-slate-950 p-4 border border-slate-800">
              {conversation.summary_3lines.map((line, idx) => (
                <p key={idx} className="text-xs text-slate-200 leading-relaxed flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">{idx === 0 ? '🎯 핵심' : '•'}</span>
                  <span className={idx === 0 ? 'font-semibold text-white' : ''}>{line}</span>
                </p>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {conversation.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 border border-slate-700/60 px-2 py-1 text-xs font-medium text-slate-300"
                >
                  <Hash className="h-3 w-3 text-indigo-400" />
                  {tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          </div>

          {/* Toggleable Original Conversation Viewer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  파싱된 원본 대화 내용 ({conversation.turn_count} 턴)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Small Markdown Copy Button */}
                <button
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>

                <button
                  onClick={() => setIsOriginalOpen(!isOriginalOpen)}
                  className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg hover:text-white transition"
                >
                  <span>{isOriginalOpen ? '접기' : '펼치기'}</span>
                  {isOriginalOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {isOriginalOpen && (
              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 transition-all duration-300">
                {conversation.full_markdown.split('\n\n### ').map((block, i) => {
                  const rawBlock = block.startsWith('### ') ? block : `### ${block}`;
                  const isUser = rawBlock.startsWith('### User');

                  const textContent = rawBlock
                    .replace(/^### User\n?/, '')
                    .replace(/^### Assistant\n?/, '')
                    .trim();

                  return (
                    <div
                      key={i}
                      className={`rounded-2xl p-4 border transition-all ${
                        isUser
                          ? 'bg-slate-900/90 border-slate-700/70 shadow-sm'
                          : 'bg-indigo-950/20 border-indigo-900/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/60">
                        <span className="text-base">{isUser ? '👤' : '🤖'}</span>
                        <span className={`text-xs font-bold ${isUser ? 'text-indigo-300' : 'text-purple-300'}`}>
                          {isUser ? 'User' : 'AI'}
                        </span>
                      </div>

                      {/* Render formatted markdown */}
                      <div
                        className={`space-y-2 leading-relaxed text-slate-200 ${
                          fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
                        }`}
                      >
                        {renderFormattedText(textContent)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: RAG Chat Integration */}
        <section className="lg:col-span-5 h-[650px] sticky top-20">
          <RagChat conversationId={conversation.id} />
        </section>
      </main>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(newId) => {
          window.location.href = `/conversation/${newId}`;
        }}
      />
    </div>
  );
}

/**
 * Format markdown text: convert bold **text**, ## Headers, and preserve paragraph spacing
 */
function renderFormattedText(text: string) {
  const paragraphs = text.split('\n\n');

  return paragraphs.map((para, pIdx) => {
    const lines = para.split('\n');

    return (
      <div key={pIdx} className="mb-2 space-y-1">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();

          // Render ## Headers
          if (trimmed.startsWith('## ')) {
            return (
              <h4 key={lIdx} className="text-sm font-bold text-indigo-200 mt-3 mb-1">
                {trimmed.replace(/^##\s+/, '')}
              </h4>
            );
          }

          if (trimmed.startsWith('# ')) {
            return (
              <h3 key={lIdx} className="text-base font-extrabold text-white mt-3 mb-1">
                {trimmed.replace(/^#\s+/, '')}
              </h3>
            );
          }

          // Parse **bold** syntax
          const parts = line.split(/(\*\*.*?\*\*)/g);

          return (
            <p key={lIdx} className="leading-normal">
              {parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={partIdx} className="font-bold text-white bg-slate-800/40 px-1 rounded">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  });
}
