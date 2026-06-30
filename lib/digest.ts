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

  // AI 분석은 실패해도 null 을 돌려주므로 요약 발송은 그대로 진행됨.
  // 분석 결과는 OG 이미지 안에 렌더되도록 ai 파라미터로 함께 전달.
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
  if (analysis) {
    // 압축 키로 URL 길이 절약(h=headline, s=summary, r=[[area,note]], c=recommendation)
    params.set(
      "ai",
      JSON.stringify({
        h: analysis.headline,
        s: analysis.summary,
        r: analysis.risks.map((x) => [x.area, x.note]),
        c: analysis.recommendation,
      }),
    );
  }
  let imageUrl = `${base}/api/og/digest?${params.toString()}`;

  // 슬랙 image_url 은 3000자 제한 — AI 텍스트로 너무 길어지면 코멘트만 이미지에서 생략.
  if (analysis && imageUrl.length > 2900) {
    params.delete("ai");
    imageUrl = `${base}/api/og/digest?${params.toString()}`;
    console.warn("[digest] AI 코멘트 포함 이미지 URL이 너무 길어 코멘트를 생략");
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
