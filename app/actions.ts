"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendSlackMessage, taskStatusMessage } from "@/lib/slack";
import { CATEGORIES, STATUSES, type Category, type Status } from "@/lib/tasks";

const nameSchema = z
  .string()
  .trim()
  .min(1, "화면명을 입력하세요.")
  .max(100, "100자 이내로 입력하세요.");

const taskSchema = z.object({ name: nameSchema, category: z.enum(CATEGORIES) });

const createSchema = z.object({
  name: nameSchema,
  categories: z.array(z.enum(CATEGORIES)).min(1, "직군을 1개 이상 선택하세요."),
});

// 추가 — 화면명 + 직군(복수 선택). 선택한 직군마다 행을 하나씩 생성.
// project='Sidee', status='todo' 는 DB 기본값.
export async function createTask(
  name: string,
  categories: string[],
): Promise<{ error: string } | { ok: true; count: number }> {
  const parsed = createSchema.safeParse({ name, categories });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // 순번 결정: 이미 있는 화면이면 그 순번 재사용, 새 화면이면 맨 아래(max+1).
  const { data: existing } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("name", parsed.data.name)
    .limit(1)
    .maybeSingle();

  let sortOrder: number;
  if (existing) {
    sortOrder = existing.sort_order;
  } else {
    const { data: maxRow } = await supabase
      .from("tasks")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (maxRow?.sort_order ?? 0) + 1;
  }

  const rows = parsed.data.categories.map((category) => ({
    name: parsed.data.name,
    category,
    sort_order: sortOrder,
  }));
  const { error } = await supabase.from("tasks").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/board");
  return { ok: true, count: rows.length };
}

// 상태 전환 — 완료면 completed_at 채우고, 아니면 비움(DB CHECK 정합성 유지).
export async function updateTaskStatus(id: string, status: Status) {
  if (!STATUSES.includes(status)) {
    throw new Error("알 수 없는 상태입니다.");
  }

  const supabase = await createClient();

  // 현재 값 조회 — 변화 여부 판단 + 알림 문구에 쓸 화면명/직군 확보.
  const { data: current, error: readError } = await supabase
    .from("tasks")
    .select("project, name, category, status")
    .eq("id", id)
    .single();
  if (readError) throw new Error(readError.message);

  if (current.status === status) {
    return; // 변화 없음 → 업데이트/알림 생략
  }

  const completed_at = status === "done" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("tasks")
    .update({ status, completed_at })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // 경로 A — 모든 상태 전환 시 전환별 맞춤 문구로 슬랙 알림(실패해도 액션은 성공).
  await sendSlackMessage(
    taskStatusMessage({
      project: current.project,
      name: current.name,
      category: current.category,
      status,
    }),
  );

  revalidatePath("/");
}

// 수정 — 화면명/직군.
export async function updateTask(id: string, name: string, category: Category) {
  const parsed = taskSchema.safeParse({ name, category });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ name: parsed.data.name, category: parsed.data.category })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}

// 삭제.
export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}
