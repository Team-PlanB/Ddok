"use client";

import { useTransition } from "react";
import { App, Button } from "antd";
import { sendDigestToSlack } from "@/app/dashboard/actions";

export default function SendDigestButton() {
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  return (
    <Button
      type="primary"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await sendDigestToSlack();
          if ("error" in res) {
            message.error(res.error);
            return;
          }
          message.success(
            res.analyzed
              ? "AI 분석과 함께 슬랙으로 보냈습니다."
              : "슬랙으로 보냈습니다. (AI 분석은 생략됨)",
          );
        })
      }
    >
      슬랙으로 보내기
    </Button>
  );
}
