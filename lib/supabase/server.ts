import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Server Action 에서 쓰는 Supabase 클라이언트.
// 로그인 사용자의 세션(쿠키) 기반 — RLS 정책(authenticated 전체 허용)이 적용됨.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 렌더 중에는 쿠키 쓰기가 막힘 — 세션 갱신은 미들웨어가 처리.
          }
        },
      },
    },
  );
}
