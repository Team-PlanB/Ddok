import { PROJECT, type Status, type Summary } from "@/lib/tasks";

// 서버 전용 — SLACK_WEBHOOK_URL 은 NEXT_PUBLIC_ 이 아니므로 클라이언트 번들에 노출되지 않음.
// 전송 실패가 호출부(사용자 액션/Cron)를 깨지 않도록 내부에서 삼키고 로그만 남김(SPEC 가드레일).
async function postToSlack(body: Record<string, unknown>): Promise<void> {
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

// 경로 B — 텍스트/이모지 기반 게이지(별도 차트 이미지 불필요).
function progressBar(percent: number, width = 10): string {
  const filled = Math.max(0, Math.min(width, Math.round((percent / 100) * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

// 경로 B — 하루 1회 요약 카드 블록 빌더. (마감 임박 섹션은 due_date 미사용으로 제외)
export function buildDigestBlocks(
  summary: Summary,
  dateLabel: string,
): { blocks: object[]; fallbackText: string } {
  const fallbackText = `Ddok 일일 요약 — ${PROJECT}: 전체 진행률 ${summary.percent}% (완료 ${summary.done}/${summary.total})`;

  const header = {
    type: "header",
    text: {
      type: "plain_text",
      text: `📊 Ddok 일일 요약 — ${PROJECT}`,
      emoji: true,
    },
  };

  if (summary.total === 0) {
    return {
      fallbackText,
      blocks: [
        header,
        {
          type: "section",
          text: { type: "mrkdwn", text: `${dateLabel}\n등록된 화면이 없습니다.` },
        },
      ],
    };
  }

  const categoryLines = summary.byCategory
    .map(
      (c) =>
        `${c.category}  \`${progressBar(c.percent)}\`  ${c.percent}% (${c.done}/${c.total})`,
    )
    .join("\n");

  return {
    fallbackText,
    blocks: [
      header,
      { type: "context", elements: [{ type: "mrkdwn", text: dateLabel }] },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*전체 진행률*  \`${progressBar(summary.percent)}\`  ${summary.percent}%`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*완료*\n${summary.done}` },
          { type: "mrkdwn", text: `*진행중*\n${summary.doing}` },
          { type: "mrkdwn", text: `*대기*\n${summary.todo}` },
          { type: "mrkdwn", text: `*전체*\n${summary.total}` },
        ],
      },
      { type: "divider" },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*직군별 진행률*\n${categoryLines}` },
      },
    ],
  };
}
