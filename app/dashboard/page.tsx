import DashboardView from "@/components/DashboardView";
import { createClient } from "@/lib/supabase/server";
import { summarizeTasks, type Task } from "@/lib/tasks";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select("*");
  const tasks = (data ?? []) as Task[];
  const summary = summarizeTasks(tasks);

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 24, width: "100%" }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>대시보드</h2>

      {error ? (
        <p>불러오기 실패: {error.message}</p>
      ) : (
        <DashboardView summary={summary} />
      )}
    </main>
  );
}
