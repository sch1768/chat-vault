# 📝 GitHub & Vercel 배포 가이드 (AI MindVault Phase 1 MVP)

## 1. 개요
이 프로젝트는 **Next.js (App Router)** 기반의 AI 대화 지식 매니저 PWA 서비스입니다.  
GitHub 저장소에 올리고 Vercel 서버로 배포하여 즉시 사용할 수 있도록 구성되어 있습니다.

---

## 2. Supabase DB 설정 (필수/선택)
`supabase/schema.sql` 파일의 SQL 쿼리를 Supabase 대시보드의 **SQL Editor**에 복사하여 실행합니다.
- `conversations` 테이블 (관계형 메타데이터)
- `conversation_chunks` 테이블 (768차원 vector 임베딩 데이터)
- `match_conversation_chunks` 코사인 유사도 검색 RPC 함수

> 💡 *참고: Supabase 환경변수를 입력하지 않을 경우 메모리 파이프라인(In-Memory Fallback)으로 자동 작동합니다.*

---

## 3. GitHub 업로드 방법
터미널에서 아래 명령을 실행하여 GitHub 새 저장소로 푸시합니다:

```bash
git add .
git commit -m "feat: complete Phase 1 MVP for AI MindVault"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## 4. Vercel 배포 및 환경변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속 ➡️ **Add New Project** 클릭.
2. 위에서 푸시한 GitHub 저장소를 선택하고 **Import**.
3. **Environment Variables** 세션에서 아래 값 입력:
   - `GEMINI_API_KEY`: Google AI Studio에서 발급받은 개인 Gemini API 키
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL (선택)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Public Key (선택)
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (선택)
4. **Deploy** 버튼 클릭 ➡️ 약 1분 후 완성된 나만의 Web/PWA 서비스 URL 생성 완료!
