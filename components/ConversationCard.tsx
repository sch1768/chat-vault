import React from 'react';
import Link from 'next/link';
import { MessageSquare, Calendar, ExternalLink, Hash, ChevronRight } from 'lucide-react';
import { ConversationRecord } from '@/lib/types';

interface ConversationCardProps {
  conversation: ConversationRecord;
  onTagClick?: (tag: string) => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({ conversation, onTagClick }) => {
  const formattedDate = new Date(conversation.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-indigo-500/10">
      <div>
        {/* Source Badge & Date */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                conversation.source_type === 'chatgpt'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : conversation.source_type === 'gemini'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              }`}
            >
              {conversation.source_type}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MessageSquare className="h-3 w-3" />
              {conversation.turn_count} 턴
            </span>
          </div>

          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <Link href={`/conversation/${conversation.id}`}>
          <h3 className="text-base font-bold text-white transition group-hover:text-indigo-300 line-clamp-1">
            {conversation.title}
          </h3>
        </Link>

        {/* 3-Line Summary */}
        <div className="mt-3 space-y-1 rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
          {conversation.summary_3lines.slice(0, 3).map((line, idx) => (
            <p key={idx} className="text-xs text-slate-300 line-clamp-1 flex items-start gap-1.5">
              <span className="text-indigo-400 font-bold">•</span>
              <span>{line}</span>
            </p>
          ))}
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {conversation.tags.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => onTagClick && onTagClick(tag)}
              className="inline-flex items-center gap-0.5 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400 hover:bg-indigo-600/20 hover:text-indigo-300 transition"
            >
              <Hash className="h-2.5 w-2.5" />
              {tag.replace(/^#/, '')}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-800/60 pt-3">
        {conversation.original_url ? (
          <a
            href={conversation.original_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 transition"
          >
            <span>원본 링크</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-slate-600">수동 작성 노트</span>
        )}

        <Link
          href={`/conversation/${conversation.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
        >
          <span>RAG 추가 질문</span>
          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};
