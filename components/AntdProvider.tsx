"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import koKR from "antd/locale/ko_KR";

// antd + Next.js App Router: SSR 스타일 추출(AntdRegistry) + 한국어 로케일 + App(message/modal 컨텍스트).
// 색/테마 커스터마이즈는 하지 않음(디자인은 추후) — antd 기본값 사용.
export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdRegistry>
      <ConfigProvider locale={koKR}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
