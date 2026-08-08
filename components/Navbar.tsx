import React from 'react';
import Link from 'next/link';
import { Brain, Plus, Sparkles, FolderKanban } from 'lucide-react';

interface NavbarProps {
  onOpenImportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenImportModal }) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">ChatVault</span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">대화 지식 자산화 & RAG 세컨드 브레인</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>대화 링크 등록</span>
          </button>
        </div>
      </div>
    </header>
  );
};
