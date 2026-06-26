import type { Status } from "@/lib/tasks";

// 사이디(Sidee) 디자인 토큰. 출처: 팀 디자인 시스템 컬러 스펙.
export const SIDEE = {
  navy: "#1D2955", // Primary / Navy
  blue: "#3368FF", // Accent / Action (Sidee Blue)
  mist: "#EBF0FF", // Surface / Tint (Sidee Mist)

  blue50: "#F5F8FF",
  blue100: "#EBF0FF",
  blue200: "#D4E0FF",
  blue300: "#B1C5FF",
  blue400: "#85A6FF",
  blue500: "#5A86FF",
  blue600: "#3368FF",
  blue700: "#3A4892",
  blue800: "#293670",
  blue900: "#1D2955",

  gray50: "#FAFBFE",
  gray100: "#F3F5FA",
  gray200: "#E5E8F1",
  gray300: "#CFD4E3",
  gray400: "#A5ACC2",
  gray500: "#737B96",
  gray600: "#505977",
  gray700: "#3F4866",
  gray800: "#2A2E49",
  gray900: "#0E1330",

  success: "#00BF40",
  warning: "#FF9200",
  error: "#FF4242",
} as const;

// 작업 상태 → 색 (현황판 상태 태그 등). antd Tag color 에 hex 그대로 사용 가능.
export const STATUS_COLOR: Record<Status, string> = {
  todo: SIDEE.gray500, // 대기 — 중립
  doing: SIDEE.blue, // 진행중 — 브랜드 블루
  done: SIDEE.success, // 완료 — 초록
};
