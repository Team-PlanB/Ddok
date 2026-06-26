"use client";

import { useTransition } from "react";
import { App, Button, Form, Input, Select } from "antd";
import { createTask } from "@/app/actions";
import { CATEGORIES } from "@/lib/tasks";

type Values = { name: string; categories: string[] };

export default function AddTaskForm() {
  const [form] = Form.useForm<Values>();
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  function onFinish(values: Values) {
    startTransition(async () => {
      const res = await createTask(values.name, values.categories);
      if ("error" in res) {
        message.error(res.error);
        return;
      }
      form.resetFields();
      message.success(`${res.count}개 추가되었습니다.`);
    });
  }

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={onFinish}
      initialValues={{ categories: ["기획", "디자인", "백엔드", "프론트엔드"] }}
    >
      <Form.Item
        name="name"
        rules={[{ required: true, message: "화면명을 입력하세요." }]}
      >
        <Input
          placeholder="화면명 (예: 로그인, 메인화면)"
          style={{ width: 240, maxWidth: "100%" }}
        />
      </Form.Item>

      <Form.Item
        name="categories"
        rules={[{ required: true, message: "직군을 1개 이상 선택하세요." }]}
      >
        <Select
          mode="multiple"
          allowClear
          style={{ width: 280, maxWidth: "100%" }}
          placeholder="직군 선택 (복수 가능)"
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={pending}>
          추가
        </Button>
      </Form.Item>
    </Form>
  );
}
