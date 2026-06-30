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

  // 차트 이미지 URL — 공개 도메인 고정(NEXT_PUBLIC_SITE_URL). 자동 Cron 호출 시
  // request origin 이 보호된 *.vercel.app 로 잡혀 슬랙이 이미지를 못 가져오는 문제 방지.
  // 미설정 시(로컬/수동) request origin 으로 폴백.
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  ).replace(/\/$/, "");
  const params = new URLSearchParams({
    total: String(summary.total),
    done: String(summary.done),
    doing: String(summary.doing),
    todo: String(summary.todo),
    date: dateLabel,
    cats: JSON.stringify(
      summary.byCategory.map((c) => [c.category, c.done, c.total]),
    ),
  });
  const imageUrl = `${base}/api/og/digest?${params.toString()}`;

  const { blocks, fallbackText } = buildDigestBlocks(summary, dateLabel, imageUrl);
  await sendSlackBlocks(blocks, fallbackText);

  return NextResponse.json({ ok: true, total: summary.total });
}
