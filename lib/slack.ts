import type { Status } from "@/lib/tasks";

// 서버 전용 — SLACK_WEBHOOK_URL 은 NEXT_PUBLIC_ 이 아니므로 클라이언트 번들에 노출되지 않음.
// 전송 실패가 사용자 액션을 깨지 않도록 예외/에러를 내부에서 삼키고 로그만 남김(SPEC 가드레일).
export async function sendSlackMessage(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn("[slack] SLACK_WEBHOOK_URL 미설정 — 전송 생략:", text);
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error("[slack] 전송 실패:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[slack] 전송 예외:", e);
  }
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
