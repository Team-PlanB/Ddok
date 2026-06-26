"use client";

import Link from "next/link";
import { Button, Flex, Typography } from "antd";
import { logout } from "@/app/login/actions";

export default function Header({ email }: { email: string }) {
  return (
    <Flex
      align="center"
      justify="space-between"
      wrap
      gap={12}
      className="app-header"
    >
      <Flex align="center" gap={24}>
        <Link href="/">
          <Typography.Text strong>Ddok</Typography.Text>
        </Link>
        <Flex gap={16}>
          <Link href="/">체크리스트</Link>
          <Link href="/board">현황판</Link>
          <Link href="/dashboard">대시보드</Link>
        </Flex>
      </Flex>
      <Flex align="center" gap={12}>
        <Typography.Text type="secondary">{email}</Typography.Text>
        <form action={logout}>
          <Button size="small" htmlType="submit">
            로그아웃
          </Button>
        </form>
      </Flex>
    </Flex>
  );
}
