-- Ddok 0002_sort_order — 화면 단위 정렬 순번(sort_order)
-- 적용: Supabase 대시보드 SQL Editor 에 붙여넣어 실행(한 번만).
-- ※ 재실행해도 안전: 백필은 sort_order=0(아직 순번 없음)인 행만 건드림.

-- 화면 단위 순번. 같은 name(=한 화면)의 여러 직군 행은 같은 값을 공유한다.
alter table public.tasks
  add column if not exists sort_order integer not null default 0;

-- 기존 데이터 백필: 화면(name)을 최초 생성시각(min created_at) 순으로 1,2,3… 부여.
-- 같은 화면의 모든 행에 동일 순번을 넣어 현재 순서를 그대로 보존한다.
with ranked as (
  select name, dense_rank() over (order by min(created_at)) as rnk
  from public.tasks
  where sort_order = 0
  group by name
)
update public.tasks t
set sort_order = r.rnk
from ranked r
where t.name = r.name
  and t.sort_order = 0;

-- 정렬 조회용 인덱스(선택적, 소규모라도 무해).
create index if not exists tasks_sort_order_idx
  on public.tasks (sort_order, created_at);
