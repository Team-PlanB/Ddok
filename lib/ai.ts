import OpenAI from "openai";
import { PROJECT, summarizeTasks, type Task } from "@/lib/tasks";

// 서버 전용 — OPENAI_API_KEY 는 NEXT_PUBLIC_ 이 아니므로 클라이언트 번들에 노출되지 않음.
// 일일 요약용 AI 피드백. 현황 수치는 이미지 카드에 있으므로 중복하지 않고, "급한 액션 아이템"만.

export type Analysis = {
  actionItems: string[]; // 지금 가장 급한 액션 2개(최대 3개)
};

// OpenAI Structured Outputs(strict json_schema) — 응답이 이 스키마를 100% 따름.
const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    actionItems: {
      type: "array",
      description: "지금 가장 급한 액션 2개(최대 3개), 짧고 구체적인 한 문장씩",
      items: { type: "string" },
    },
  },
  required: ["actionItems"],
} as const;

const SYSTEM_PROMPT = `당신은 ${PROJECT} 팀에게 부드럽고 공손한 존댓말로 "지금 가장 급한 액션 아이템"만 짚어 주는 어시스턴트입니다.
현황 수치(전체/완료/진행중 개수 등)는 이미 이미지 카드에 있으니 절대 나열하지 마세요. 제목·요약·예상 오픈일자도 만들지 마세요.

actionItems — 오픈을 앞당기거나 막힌 곳을 풀기 위해 지금 가장 급한 액션 2개만(꼭 필요하면 최대 3개).
진행 순서(기획→디자인→백엔드→프론트)와 정체된 직군/화면(inProgress, notStarted, byCategory)을 고려해,
각 항목은 짧고 구체적이며 실행 가능한 한 문장으로, 권유하는 어조로 작성하세요.

데이터에 없는 사실은 지어내지 마세요.`;

const DAY_MS = 24 * 60 * 60 * 1000;

function buildInput(tasks: Task[]) {
  const summary = summarizeTasks(tasks);
  const now = Date.now();

  const recentlyCompleted = tasks
    .filter(
      (t) =>
        t.status === "done" &&
        t.completed_at &&
        now - new Date(t.completed_at).getTime() < DAY_MS,
    )
    .map((t) => `${t.name}(${t.category})`);
  const inProgress = tasks
    .filter((t) => t.status === "doing")
    .map((t) => `${t.name}(${t.category})`);
  const notStarted = tasks
    .filter((t) => t.status === "todo")
    .map((t) => `${t.name}(${t.category})`);

  return {
    project: PROJECT,
    overall: {
      total: summary.total,
      done: summary.done,
      doing: summary.doing,
      todo: summary.todo,
      percent: summary.percent,
    },
    byCategory: summary.byCategory.map((c) => ({
      category: c.category,
      done: c.done,
      total: c.total,
      percent: c.percent,
    })),
    inProgress,
    notStarted,
    recentlyCompletedLast24h: recentlyCompleted,
  };
}

// 분석 생성. 로컬/키 미설정/오류 시 null 을 반환해 호출부(요약 발송)가 깨지지 않게 함.
export async function analyzeProgress(tasks: Task[]): Promise<Analysis | null> {
  // 로컬(개발)에서는 실제 OpenAI 호출하지 않음. 로컬 테스트하려면 AI_ENABLE=1.
  if (process.env.NODE_ENV !== "production" && process.env.AI_ENABLE !== "1") {
    console.log("[ai] 로컬 환경 — 분석 생략");
    return null;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[ai] OPENAI_API_KEY 미설정 — 분석 생략");
    return null;
  }
  if (tasks.length === 0) return null;

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(buildInput(tasks)) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "action_items",
          strict: true,
          schema: ANALYSIS_SCHEMA,
        },
      },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    return JSON.parse(raw) as Analysis;
  } catch (e) {
    console.error("[ai] 분석 실패:", e);
    return null;
  }
}
