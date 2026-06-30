import { analyzeProgress } from "@/lib/ai";
import { buildDigestBlocks, sendSlackBlocks } from "@/lib/slack";
import { summarizeTasks, type Task } from "@/lib/tasks";

// 일일 요약 발송(경로 B). Cron(자동)과 대시보드 버튼(수동)이 공유.
// baseUrl: 슬랙이 unauth 로 가져갈 공개 이미지 도메인. 보호된 *.vercel.app 가 아니어야 함
// (NEXT_PUBLIC_SITE_URL 고정 권장).
export async function sendDailyDigest(
  tasks: Task[],
  baseUrl: string,
): Promise<{ total: number; analyzed: boolean }> {
  const summary = summarizeTasks(tasks);
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
  }).format(new Date());

  // AI 액션 아이템은 OG 이미지 안에 렌더되도록 ai 파라미터로 함께 전달(실패 시 null → 생략).
  const analysis = await analyzeProgress(tasks);

  const base = baseUrl.replace(/\/$/, "");
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
  if (analysis && analysis.actionItems.length > 0) {
    params.set("ai", JSON.stringify(analysis.actionItems));
  }
  let imageUrl = `${base}/api/og/digest?${params.toString()}`;

  // 슬랙 image_url 3000자 제한 — 혹시 너무 길면 액션 아이템만 이미지에서 생략.
  if (params.has("ai") && imageUrl.length > 2900) {
    params.delete("ai");
    imageUrl = `${base}/api/og/digest?${params.toString()}`;
    console.warn("[digest] 이미지 URL이 너무 길어 액션 아이템을 생략");
  }

  const { blocks, fallbackText } = buildDigestBlocks(
    summary,
    dateLabel,
    imageUrl,
    analysis,
  );
  await sendSlackBlocks(blocks, fallbackText);

  return { total: summary.total, analyzed: analysis !== null };
}
