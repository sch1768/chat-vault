import React, { useState } from 'react';
import { X, Link2, FileText, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { ParsedConversation, ConversationSummary } from '@/lib/types';
import confetti from 'canvas-confetti';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [inputVal, setInputVal] = useState('');
  const [step, setStep] = useState<number>(0); // 0: Idle, 1: Parsing (30%), 2: Summarizing (60%), 3: Embedding (100%)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setErrorMsg(null);
    setStep(1); // 30% Progress

    try {
      // 1. Step 1: Parse Shared Link or Text
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlOrText: inputVal }),
      });

      const parseData = await parseRes.json();
      if (!parseRes.ok || !parseData.parsed) {
        throw new Error(parseData.error || '파싱에 실패했습니다.');
      }

      const parsed: ParsedConversation = parseData.parsed;
      setStep(2); // 60% Progress

      // 2. Step 2: Summarize with Gemini
      const sumRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns: parsed.turns, title: parsed.title }),
      });

      const sumData = await sumRes.json();
      const summary: ConversationSummary = sumData.summary || {
        title: parsed.title,
        summary3Lines: ['파싱된 대화입니다.'],
        tags: ['#대화'],
      };

      setStep(3); // 100% Progress - Embedding & Indexing

      // 3. Step 3: Embed & Save Vector DB
      const saveRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsed,
          summary3Lines: summary.summary3Lines,
          tags: summary.tags,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.id) {
        throw new Error(saveData.error || '저장에 실패했습니다.');
      }

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      onSuccess(saveData.id);
      onClose();
      resetForm();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setStep(0);
    }
  };

  const resetForm = () => {
    setInputVal('');
    setStep(0);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-indigo-500/10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">새 대화 수집 & RAG 등록</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              ChatGPT 또는 Gemini 공유 링크 (URL)
            </label>
            <input
              type="url"
              required
              disabled={step > 0}
              placeholder="https://chatgpt.com/share/... 또는 https://g.co/gemini/share/..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              💡 공유 링크만 입력하면 본문 전체 턴과 맥락을 자동으로 추출하고 요약합니다.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 3-Step Progress Bar Feedback */}
          {step > 0 && (
            <div className="space-y-2 rounded-xl bg-slate-950 p-4 border border-slate-800">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  {step === 1 && '1단계: 대화 내용 웹 파싱 중 (30%)'}
                  {step === 2 && '2단계: Gemini AI 3줄 요약 & 자동 태깅 중 (60%)'}
                  {step === 3 && '3단계: RAG 벡터 DB 임베딩 & 저장 완료 중 (100%)'}
                </span>
                <span className="text-indigo-400">{step === 1 ? '30%' : step === 2 ? '60%' : '100%'}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${step === 1 ? 30 : step === 2 ? 60 : 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={step > 0}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={step > 0 || !inputVal.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
            >
              {step > 0 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>분석 & 저장 등록</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
