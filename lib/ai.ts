import OpenAI from "openai";
import { PROJECT, summarizeTasks, type Task } from "@/lib/tasks";

// 서버 전용 — OPENAI_API_KEY 는 NEXT_PUBLIC_ 이 아니므로 클라이언트 번들에 노출되지 않음.
// 일일 요약에 들어갈 AI 진척 분석(요약 + 리스크 + 추천). 집계 수치만 모델에 전달.

export type Analysis = {
  headline: string;
  summary: string;
  risks: { area: string; note: string }[];
  recommendation: string;
};

// OpenAI Structured Outputs(strict json_schema) — 응답이 이 스키마를 100% 따름.
const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string", description: "오늘 상황을 한 줄로 요약하는 제목" },
    summary: { type: "string", description: "전체 진척을 1~2문장으로 요약" },
    risks: {
      type: "array",
      description: "정체되었거나 주의가 필요한 직군/화면 (없으면 빈 배열)",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          area: { type: "string", description: "대상(직군 또는 화면명)" },
          note: { type: "string", description: "이유 한 문장" },
        },
        required: ["area", "note"],
      },
    },
    recommendation: { type: "string", description: "다음에 집중하면 좋을 일 1문장" },
  },
  required: ["headline", "summary", "risks", "recommendation"],
} as const;

const SYSTEM_PROMPT = `당신은 ${PROJECT} 팀의 진척 현황을 따뜻하고 공손하게 전해 주는 어시스턴트입니다.
주어진 집계 데이터만 근거로, 정중하고 부드러운 존댓말로 작성하세요.
팀을 다그치거나 단정 짓지 말고, 격려하고 제안하는 어조를 유지하세요.

- headline: 오늘 상황을 한 줄로 부드럽게 요약하는 제목
- summary: 전체 진척을 1~2문장으로 따뜻하게 요약
- risks: 조금 더 살펴보면 좋을 부분(정체된 직군이나 화면 등). 특별히 없으면 빈 배열로 두세요. 경고가 아니라 "~을 함께 챙기면 좋겠습니다" 같은 제안 어조로, 각 항목은 area(대상)와 note(부드러운 제안 한 문장)
- recommendation: 다음에 함께 집중하면 좋을 일을 권하는 1문장

데이터에 없는 사실은 지어내지 말고, 수치도 과장하지 마세요.
이미지 카드에 들어가므로 간결하게 작성하세요 — summary는 2문장 이내, risks는 최대 2~3개, 각 문장은 너무 길지 않게.`;

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
    recentlyCompletedLast24h: recentlyCompleted,
    inProgress,
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
          name: "progress_analysis",
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
