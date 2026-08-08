'use client';

import React from 'react';
import { Sparkles, X, Check, EyeOff, BookOpen, Layers } from 'lucide-react';

interface GuidePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onHideForever: () => void;
}

export const GuidePopup: React.FC<GuidePopupProps> = ({ isOpen, onClose, onHideForever }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-indigo-500/10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">ChatVault 사용 안내</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="rounded-2xl bg-indigo-950/40 p-4 border border-indigo-900/50 space-y-2">
            <h3 className="font-extrabold text-sm text-indigo-200">
              흩어진 AI 대화를 나만의 검증된 지식 자산으로
            </h3>
            <p className="text-slate-300">
              ChatGPT와 Gemini에서 나눈 소중한 대화 링크를 입력하면 Gemma AI가 3줄 핵심 요약과 결론, 카테고리 태그를 자동 생성합니다.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>간단 사용 방법</span>
            </h4>
            <ul className="space-y-2 text-slate-300 pl-1">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                  1
                </span>
                <span>오른쪽 상단 <strong>[대화 링크 등록]</strong> 버튼을 누릅니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                  2
                </span>
                <span>ChatGPT 또는 Gemini의 공개 공유 링크(URL)를 입력합니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                  3
                </span>
                <span>핵심 요약을 확인하고, 우측/하단 RAG 채팅에서 환각 없이 이어서 질문해보세요.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
          <button
            onClick={onHideForever}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>다시 보지 않기</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition active:scale-95"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
