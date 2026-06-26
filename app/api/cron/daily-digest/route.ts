import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDigestBlocks, sendSlackBlocks } from "@/lib/slack";
import { summarizeTasks, type Task } from "@/lib/tasks";

// 경로 B — 하루 1회 슬랙 요약. Vercel Cron 이 호출(0 0 * * * UTC = 09:00 KST).
// Vercel 은 CRON_SECRET 이 설정돼 있으면 Authorization: Bearer <CRON_SECRET> 헤더를 자동 첨부함.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cron 은 사용자 세션이 없으므로 service_role 로 조회(RLS 우회).
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("tasks").select("*");
  if (error) {
    console.error("[cron] tasks 조회 실패:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = summarizeTasks((data ?? []) as Task[]);
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
  }).format(new Date());

  const { blocks, fallbackText } = buildDigestBlocks(summary, dateLabel);
  await sendSlackBlocks(blocks, fallbackText);

  return NextResponse.json({ ok: true, total: summary.total });
}
