"use server";

import { createClient } from "@/lib/supabase/server";
import { sendDailyDigest } from "@/lib/digest";
import { type Task } from "@/lib/tasks";

// 수동 — 현재 진척을 일일 요약(AI 분석 + 이미지 카드)으로 슬랙에 전송.
export async function sendDigestToSlack(): Promise<
  { ok: true; analyzed: boolean } | { error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select("*");
  if (error) return { error: error.message };

  const tasks = (data ?? []) as Task[];
  if (tasks.length === 0) return { error: "등록된 화면이 없습니다." };

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await sendDailyDigest(tasks, base);

  return { ok: true, analyzed: res.analyzed };
}
