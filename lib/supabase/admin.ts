import { createClient } from "@supabase/supabase-js";

// 서버 전용 service_role 클라이언트 — 사용자 세션이 없는 곳(예: Cron 요약)에서 RLS 우회.
// 절대 클라이언트 번들로 새어나가면 안 됨(service_role 키).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
