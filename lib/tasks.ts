// tasks 도메인 공통 타입/상수. SPEC/DECISIONS 의 데이터 모델과 1:1.

// 표시/집계 순서 = 실제 프로젝트 순서(기획 → 디자인 → 백엔드 → 프론트엔드), 기타는 catch-all 로 마지막.
export const CATEGORIES = ["기획", "디자인", "백엔드", "프론트엔드", "기타"] as const;
export type Category = (typeof CATEGORIES)[number];

// 체크리스트에서 한 화면 안의 역할(직군) 정렬 순서: 기획 → 백엔드 → 디자인 → 프론트엔드 → 기타.
// (현황판 컬럼/요약에 쓰는 CATEGORIES 와는 별개의 작업 흐름 순서.)
export const CHECKLIST_CATEGORY_ORDER = [
  "기획",
  "백엔드",
  "디자인",
  "프론트엔드",
  "기타",
] as const satisfies readonly Category[];

export function checklistCategoryRank(category: Category): number {
  const i = CHECKLIST_CATEGORY_ORDER.indexOf(category);
  return i === -1 ? CHECKLIST_CATEGORY_ORDER.length : i;
}

// 체크리스트 정렬: 화면(sort_order) → 역할(위 순서) → 생성순(안정 정렬 tie-break).
export function sortForChecklist(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      checklistCategoryRank(a.category) - checklistCategoryRank(b.category),
  );
}

// created_at(UTC ISO)이 한국시각 기준 '오늘'이면 true — New 뱃지용.
export function isNewToday(createdAt: string): boolean {
  const kst = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  return kst(new Date(createdAt)) === kst(new Date());
}

export const STATUSES = ["todo", "doing", "done"] as const;
export type Status = (typeof STATUSES)[number];

// DB 는 영문키로 저장, 화면엔 한글로 표시.
export const STATUS_LABELS: Record<Status, string> = {
  todo: "대기",
  doing: "진행중",
  done: "완료",
};

export const PROJECT = "Sidee";

export type Task = {
  id: string;
  project: string;
  name: string;
  category: Category;
  status: Status;
  completed_at: string | null;
  created_at: string;
  sort_order: number; // 화면 단위 순번(같은 name 은 동일 값). 오름차순 정렬.
};

// --- 집계 (대시보드 + Cron 요약 공용) ---

export type CategorySummary = {
  category: Category;
  total: number;
  done: number;
  doing: number;
  todo: number;
  percent: number;
};

export type Summary = {
  total: number;
  done: number;
  doing: number;
  todo: number;
  percent: number;
  byCategory: CategorySummary[];
};

function percentOf(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function summarizeTasks(tasks: Task[]): Summary {
  const countBy = (list: Task[], s: Status) =>
    list.filter((t) => t.status === s).length;

  const done = countBy(tasks, "done");
  const doing = countBy(tasks, "doing");
  const todo = countBy(tasks, "todo");

  const byCategory: CategorySummary[] = CATEGORIES.map((category) => {
    const list = tasks.filter((t) => t.category === category);
    const d = countBy(list, "done");
    return {
      category,
      total: list.length,
      done: d,
      doing: countBy(list, "doing"),
      todo: countBy(list, "todo"),
      percent: percentOf(d, list.length),
    };
  }).filter((c) => c.total > 0);

  return {
    total: tasks.length,
    done,
    doing,
    todo,
    percent: percentOf(done, tasks.length),
    byCategory,
  };
}

// --- 화면 × 직군 매트릭스 (현황판) ---

export type MatrixRow = {
  name: string;
  cells: Partial<Record<Category, Status>>;
  createdAt: string; // 화면(name) 최초 생성시각 — New 뱃지 판단용
};
export type Matrix = { columns: Category[]; rows: MatrixRow[] };

// 행=화면(생성순), 열=데이터에 존재하는 직군(CATEGORIES 순서), 칸=상태.
export function buildMatrix(tasks: Task[]): Matrix {
  const columns = CATEGORIES.filter((c) => tasks.some((t) => t.category === c));
  const order: string[] = [];
  const byName = new Map<string, MatrixRow>();

  for (const t of tasks) {
    let row = byName.get(t.name);
    if (!row) {
      row = { name: t.name, cells: {}, createdAt: t.created_at };
      byName.set(t.name, row);
      order.push(t.name);
    } else if (t.created_at < row.createdAt) {
      row.createdAt = t.created_at; // 화면 내 가장 이른 생성시각 유지
    }
    row.cells[t.category] = t.status;
  }

  return { columns, rows: order.map((n) => byName.get(n)!) };
}
