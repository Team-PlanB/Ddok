"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendSlackBlocks } from "@/lib/slack";
import { buildMatrix, isNewToday, PROJECT, type Status, type Task } from "@/lib/tasks";

const STATUS_DIGIT: Record<Status, string> = { todo: "1", doing: "2", done: "3" };

// 수동 — 현재 현황판을 이미지 카드로 슬랙에 전송.
export async function sendBoardToSlack(): Promise<
  { ok: true } | { error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { error: error.message };

  const matrix = buildMatrix((data ?? []) as Task[]);
  if (matrix.rows.length === 0) return { error: "등록된 화면이 없습니다." };

  const date = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
  }).format(new Date());

  // [화면명, 상태숫자열, New여부("1"/"0")]
  const rows = matrix.rows.map((r) => [
    r.name,
    matrix.columns.map((c) => (r.cells[c] ? STATUS_DIGIT[r.cells[c]!] : "0")).join(""),
    isNewToday(r.createdAt) ? "1" : "0",
  ]);

  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const params = new URLSearchParams({
    date,
    cols: JSON.stringify(matrix.columns),
    rows: JSON.stringify(rows),
  });
  const imageUrl = `${base}/api/og/board?${params.toString()}`;
  if (imageUrl.length > 2900) {
    return {
      error: "현황이 많아 이미지로 보내기 어렵습니다. 화면 수를 줄여 다시 시도해주세요.",
    };
  }

  const fallbackText = `Ddok 현황판 — ${PROJECT} (${date})`;
  await sendSlackBlocks(
    [
      { type: "image", image_url: imageUrl, alt_text: fallbackText },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `Ddok 현황판 · ${date}` }],
      },
    ],
    fallbackText,
  );

  return { ok: true };
}

// 화면(name) 단위 재정렬 — 드래그로 만든 새 순서(names)를 그대로 저장.
// names[i] 화면의 모든 직군 행에 sort_order = i+1 을 부여한다(같은 name 일괄).
export async function reorderScreens(
  names: string[],
): Promise<{ ok: true } | { error: string }> {
  if (names.length === 0) return { ok: true };
  const supabase = await createClient();

  const results = await Promise.all(
    names.map((name, i) =>
      supabase.from("tasks").update({ sort_order: i + 1 }).eq("name", name),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/board");
  revalidatePath("/");
  return { ok: true };
}
