"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Drawer, Flex, Grid, Typography } from "antd";
import { logout } from "@/app/login/actions";

const NAV = [
  { href: "/", label: "체크리스트" },
  { href: "/board", label: "현황판" },
  { href: "/dashboard", label: "대시보드" },
];

export default function Header({ email }: { email: string }) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [open, setOpen] = useState(false);

  // 모바일: 로고 + 햄버거 → Drawer 로 내비 접기
  if (isMobile) {
    return (
      <>
        <Flex align="center" justify="space-between" className="app-header">
          <Link href="/">
            <Typography.Text strong>Ddok</Typography.Text>
          </Link>
          <Button
            type="text"
            aria-label="메뉴 열기"
            onClick={() => setOpen(true)}
            style={{ fontSize: 18 }}
          >
            ☰
          </Button>
        </Flex>
        <Drawer
          title="Ddok"
          placement="right"
          width={260}
          open={open}
          onClose={() => setOpen(false)}
        >
          <Flex vertical gap={16}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {email}
            </Typography.Text>
            <form action={logout}>
              <Button htmlType="submit" block>
                로그아웃
              </Button>
            </form>
          </Flex>
        </Drawer>
      </>
    );
  }

  // 데스크톱/태블릿: 가로 내비
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
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
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
