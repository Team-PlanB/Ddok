"use client";

import { useTransition } from "react";
import { App, Button, Form, Input } from "antd";
import { login } from "@/app/login/actions";

type Values = { email: string; password: string };

export default function LoginForm() {
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  function onFinish(values: Values) {
    startTransition(async () => {
      const res = await login(values.email, values.password);
      // 성공 시 서버 액션이 redirect 하므로 여기로 돌아오지 않음.
      if (res?.error) message.error(res.error);
    });
  }

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      style={{ width: 320, maxWidth: "100%" }}
    >
      <Form.Item
        label="이메일"
        name="email"
        rules={[
          { required: true, message: "이메일을 입력하세요." },
          { type: "email", message: "이메일 형식이 올바르지 않습니다." },
        ]}
      >
        <Input autoComplete="email" />
      </Form.Item>

      <Form.Item
        label="비밀번호"
        name="password"
        rules={[{ required: true, message: "비밀번호를 입력하세요." }]}
      >
        <Input.Password autoComplete="current-password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={pending}>
          로그인
        </Button>
      </Form.Item>
    </Form>
  );
}
