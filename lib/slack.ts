import type { Analysis } from "@/lib/ai";
import { PROJECT, type Status, type Summary } from "@/lib/tasks";

// 서버 전용 — SLACK_WEBHOOK_URL 은 NEXT_PUBLIC_ 이 아니므로 클라이언트 번들에 노출되지 않음.
// 전송 실패가 호출부(사용자 액션/Cron)를 깨지 않도록 내부에서 삼키고 로그만 남김(SPEC 가드레일).
async function postToSlack(body: Record<string, unknown>): Promise<void> {
  // 로컬(개발)에서는 실제 슬랙 채널로 보내지 않음. 로컬에서 테스트하려면 SLACK_ENABLE=1.
  if (process.env.NODE_ENV !== "production" && process.env.SLACK_ENABLE !== "1") {
    console.log("[slack] 로컬 환경 — 전송 생략:", JSON.stringify(body));
    return;
  }

  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn("[slack] SLACK_WEBHOOK_URL 미설정 — 전송 생략:", JSON.stringify(body));
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[slack] 전송 실패:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[slack] 전송 예외:", e);
  }
}

// 경로 A — 한 줄 텍스트.
export async function sendSlackMessage(text: string): Promise<void> {
  await postToSlack({ text });
}

// 경로 B — Block Kit 카드(블록). fallbackText 는 알림/접근성용 대체 텍스트.
export async function sendSlackBlocks(
  blocks: object[],
  fallbackText: string,
): Promise<void> {
  await postToSlack({ text: fallbackText, blocks });
}

// 경로 A — 상태 전환별 맞춤 문구.
const STATUS_PHRASE: Record<Status, string> = {
  done: "완료되었습니다",
  doing: "진행중으로 변경되었습니다",
  todo: "대기로 변경되었습니다",
};

export function taskStatusMessage(task: {
  project: string;
  name: string;
  category: string;
  status: Status;
}): string {
  return `[알림] ${task.project} ${task.name} ${task.category} 작업이 ${STATUS_PHRASE[task.status]}.`;
}

// 경로 B — 하루 1회 요약 카드. AI 코멘트(있으면)는 /api/og/digest 가 렌더한 PNG 이미지 안에
// 함께 그려짐(사이디 브랜드 컬러·카드형 통계·직군별 막대). 슬랙엔 이미지 + 컨텍스트만.
export function buildDigestBlocks(
  summary: Summary,
  dateLabel: string,
  imageUrl: string,
  analysis?: Analysis | null,
): { blocks: object[]; fallbackText: string } {
  // fallbackText 는 알림 미리보기/접근성용 — AI 코멘트가 있으면 headline 을 노출.
  const fallbackText = analysis
    ? `Ddok 일일 요약 — ${PROJECT} (${dateLabel}): ${analysis.headline}`
    : `Ddok 일일 요약 — ${PROJECT} (${dateLabel}): 전체 ${summary.percent}% · 완료 ${summary.done}/${summary.total}`;

  return {
    fallbackText,
    blocks: [
      { type: "image", image_url: imageUrl, alt_text: fallbackText },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: "Ddok · 똑 부러지는 프로젝트 관리" }],
      },
    ],
  };
}
