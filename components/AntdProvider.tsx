"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import koKR from "antd/locale/ko_KR";

// antd + Next.js App Router: SSR 스타일 추출(AntdRegistry) + 한국어 로케일 + App(message/modal 컨텍스트).
// fontSize 16: iOS Safari는 input 폰트가 16px 미만이면 포커스 시 자동 확대(줌)됨 → 기본 14px를 16px로 올려 방지.
export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdRegistry>
      <ConfigProvider locale={koKR} theme={{ token: { fontSize: 16 } }}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
