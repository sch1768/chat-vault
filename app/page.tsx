'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ImportModal } from '@/components/ImportModal';
import { GuidePopup } from '@/components/GuidePopup';
import { ConversationCard } from '@/components/ConversationCard';
import { ConversationRecord } from '@/lib/types';
import { Search, Hash, Brain, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGuidePopupOpen, setIsGuidePopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  useEffect(() => {
    // Check if user chose "don't show guide popup"
    const hideGuide = localStorage.getItem('chatvault_hide_guide');
    if (!hideGuide) {
      setIsGuidePopupOpen(true);
    }
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleHideGuideForever = () => {
    localStorage.setItem('chatvault_hide_guide', 'true');
    setIsGuidePopupOpen(false);
  };

  // Collect unique tags
  const allTags = Array.from(new Set(conversations.flatMap((c) => c.tags || [])));

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary_3lines.some((line) => line.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag ? c.tags.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        onOpenImportModal={() => setIsImportModalOpen(true)}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & Tag Filter Bar */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="대화 제목 또는 요약 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Tag Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setSelectedTag(null)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                selectedTag === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              전체 보기 ({conversations.length})
            </button>

            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Hash className="h-3 w-3 text-indigo-400" />
                <span>{tag.replace(/^#/, '')}</span>
              </button>
            ))}

            <button
              onClick={fetchConversations}
              title="목록 새로고침"
              className="rounded-lg p-2 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition ml-auto sm:ml-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </section>

        {/* Conversation Grid */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConversations.map((c) => (
                <ConversationCard
                  key={c.id}
                  conversation={c}
                  onTagClick={(tag) => setSelectedTag(tag)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-4">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">등록된 대화 기록이 없습니다</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                우측 상단의 <strong className="text-indigo-400">'대화 링크 등록'</strong> 버튼을 눌러 ChatGPT나 Gemini 공유 링크를 첫 지식 자산으로 등록해 보세요.
              </p>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="mt-4 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition"
              >
                + 첫 대화 수집하기
              </button>
            </div>
          )}
        </section>
      </main>

      <GuidePopup
        isOpen={isGuidePopupOpen}
        onClose={() => setIsGuidePopupOpen(false)}
        onHideForever={handleHideGuideForever}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(id) => {
          fetchConversations();
          router.push(`/conversation/${id}`);
        }}
      />
    </div>
  );
}
