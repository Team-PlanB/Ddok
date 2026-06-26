import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16: 기존 middleware 컨벤션의 후속(proxy). 매 요청 전 세션을 갱신/검증.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // 정적 파일과 /api/* 는 제외(API/Cron 라우트는 자체 시크릿으로 보호).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
