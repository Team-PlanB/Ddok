-- Ddok 0001_init — tasks 테이블 + RLS
-- 적용: Supabase 대시보드 SQL Editor 에 붙여넣어 실행하거나, Supabase CLI 로 마이그레이션.

create table if not exists public.tasks (
  id           uuid        primary key default gen_random_uuid(),
  project      text        not null default 'Sidee',
  name         text        not null,
  category     text        not null check (category in ('개발', '디자인', '기획', '기타')),
  status       text        not null default 'todo' check (status in ('todo', 'doing', 'done')),
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- 대기/진행중에서는 completed_at 이 비어 있어야 하고, 완료면 채워져 있어야 함(데이터 정합성).
alter table public.tasks
  add constraint tasks_completed_at_consistency
  check ((status = 'done') = (completed_at is not null));

-- anon 키가 public(NEXT_PUBLIC_)이므로 RLS 필수.
alter table public.tasks enable row level security;

-- 로그인(authenticated) 사용자는 모두 같은 tasks 를 공유(전체 CRUD 허용).
create policy "authenticated full access on tasks"
  on public.tasks
  for all
  to authenticated
  using (true)
  with check (true);
