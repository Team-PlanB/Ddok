import type { Metadata } from "next";
import "./globals.css";
import AntdProvider from "@/components/AntdProvider";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ddok",
  description: "똑 부러지는 프로젝트 관리 — 사이디 진척 관리 + 슬랙 알림 내부 도구",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ko">
      <body>
        <AntdProvider>
          {user && <Header email={user.email ?? ""} />}
          {children}
        </AntdProvider>
      </body>
    </html>
  );
}
