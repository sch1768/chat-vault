import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChatVault - AI 대화 지식 매니저 & RAG',
  description: 'ChatGPT, Gemini 대화 기록을 자동 요약하고 환각 없이 이어서 질문하는 세컨드 브레인 PWA',
  manifest: '/manifest.json',
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
