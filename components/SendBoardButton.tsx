"use client";

import { useTransition } from "react";
import { App, Button } from "antd";
import { sendBoardToSlack } from "@/app/board/actions";

export default function SendBoardButton() {
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  return (
    <Button
      type="primary"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await sendBoardToSlack();
          if ("error" in res) {
            message.error(res.error);
            return;
          }
          message.success("슬랙으로 보냈습니다.");
        })
      }
    >
      슬랙으로 보내기
    </Button>
  );
}
