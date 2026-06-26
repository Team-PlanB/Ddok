# CLAUDE.md

이 레포는 사이디(Sidee) 프로젝트의 **진척 관리 + 슬랙 알림 내부 도구 — Ddok** 입니다.
전체 사양은 `SPEC.md` 참고. 이 파일은 매 작업 시 지켜야 할 규칙 요약입니다.

## 이름 표기 (중요)
- 기술용 식별자는 **소문자 `ddok`**: 레포명, `package.json`의 `"name": "ddok"`, 폴더명, Vercel 프로젝트 슬러그. (대문자로 폴더/패키지 만들지 말 것 — Next.js/npm에서 문제됨)
- 사람에게 보이는 표시용은 **`Ddok`**: 문서 제목, 대시보드 헤더, 슬랙 메시지 본문.
- 태그라인: "똑 부러지는 프로젝트 관리"

## 스택
- Next.js (App Router)
- Vercel 배포
- Supabase (Postgres)
- Vercel Cron (스케줄)

## 반드시 지킬 가드레일
- **상태는 전부 DB(Supabase)에 저장.** Vercel은 서버리스라 메모리/파일 저장은 배포 후 날아감 → 절대 금지.
- **슬랙 웹훅 호출은 서버사이드에서만** (Server Action / Route Handler). `SLACK_WEBHOOK_URL`을 클라이언트 코드·번들에 노출 금지.
- **Cron 라우트(`/api/cron/*`)는 `CRON_SECRET`으로 보호.** 헤더/시크릿 검사 후 실행.
- **Vercel Cron 무료 티어는 하루 1회.** 분 단위 스케줄 사용하지 말 것.
- Postgres는 마켓플레이스 연동(Supabase). `@vercel/postgres`(구 Vercel Postgres) 쓰지 말 것 — 폐기됨.

## 환경변수
- `SLACK_WEBHOOK_URL` — 슬랙 Incoming Webhook
- `CRON_SECRET` — Cron 보호용
- Supabase 연동 변수 (DATABASE_URL 등)
- ※ 비밀값을 코드에 하드코딩하지 말 것. `.env.local` / Vercel 환경변수로만.

## 작업 방식
- 작업은 `SPEC.md`의 마일스톤 순서대로: ①스키마+CRUD → ②실시간 알림 → ③대시보드 → ④Cron 요약.
- 아직 안 정한 항목(SPEC 9번)은 임의 결정하지 말고 먼저 확인할 것.
- 슬랙 메시지 형식은 SPEC 6번 템플릿을 따를 것.
