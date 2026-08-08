'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, Plus, Settings, Sparkles, X, Sun, Moon, Type, BookOpen } from 'lucide-react';

interface NavbarProps {
  onOpenImportModal: () => void;
  fontSize: 'sm' | 'base' | 'lg';
  setFontSize: (size: 'sm' | 'base' | 'lg') => void;
  ragModel?: string;
  setRagModel?: (model: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenImportModal,
  fontSize,
  setFontSize,
  ragModel: propRagModel,
  setRagModel: propSetRagModel,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localRagModel, setLocalRagModel] = useState<string>('gemma-4-31b-it');

  useEffect(() => {
    const savedModel = localStorage.getItem('chatvault_rag_model');
    if (savedModel) setLocalRagModel(savedModel);
  }, []);

  const handleModelChange = (model: string) => {
    setLocalRagModel(model);
    localStorage.setItem('chatvault_rag_model', model);
    window.dispatchEvent(new Event('storage'));
    if (propSetRagModel) propSetRagModel(model);
  };

  const currentModel = propRagModel || localRagModel;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Version */}
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">ChatVault</span>
            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
              v.1
            </span>
          </div>
        </Link>

        {/* Right Actions: Register Link & Settings */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md transition hover:from-indigo-500 hover:to-purple-500 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>대화 링크 등록</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title="시각 설정"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings Dropdown / Modal */}
      {isSettingsOpen && (
        <div className="absolute right-4 top-16 z-40 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5 text-indigo-400" />
              <span>시각 및 환경 설정</span>
            </h4>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* RAG AI Model Selection */}
            <div>
              <label className="text-slate-400 font-semibold mb-1.5 block flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>RAG 채팅 AI 모델 선택</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => handleModelChange('gemma-4-31b-it')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-left flex items-center justify-between transition ${
                    currentModel === 'gemma-4-31b-it'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Gemma-4 31B (기본)</span>
                  {currentModel === 'gemma-4-31b-it' && <span className="text-[10px]">✓</span>}
                </button>
                <button
                  onClick={() => handleModelChange('gemini-2.5-flash-lite')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-left flex items-center justify-between transition ${
                    currentModel === 'gemini-2.5-flash-lite'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Gemini 2.5 Flash Lite (빠름)</span>
                  {currentModel === 'gemini-2.5-flash-lite' && <span className="text-[10px]">✓</span>}
                </button>
                <button
                  onClick={() => handleModelChange('gemini-1.5-flash-lite')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-left flex items-center justify-between transition ${
                    currentModel === 'gemini-1.5-flash-lite'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Gemini 1.5 Flash Lite (초경량)</span>
                  {currentModel === 'gemini-1.5-flash-lite' && <span className="text-[10px]">✓</span>}
                </button>
              </div>
            </div>

            {/* Font Size Option */}
            <div>
              <label className="text-slate-400 font-semibold mb-1.5 block flex items-center gap-1">
                <Type className="h-3.5 w-3.5 text-indigo-400" />
                <span>글자 크기 (전체 UI 연동)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setFontSize('sm')}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    fontSize === 'sm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  작게
                </button>
                <button
                  onClick={() => setFontSize('base')}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    fontSize === 'base' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  보통
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    fontSize === 'lg' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  크게
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
