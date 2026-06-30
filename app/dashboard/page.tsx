import DashboardView from "@/components/DashboardView";
import SendDigestButton from "@/components/SendDigestButton";
import { createClient } from "@/lib/supabase/server";
import { summarizeTasks, type Task } from "@/lib/tasks";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select("*");
  const tasks = (data ?? []) as Task[];
  const summary = summarizeTasks(tasks);

  return (
    <main className="page" style={{ maxWidth: 880 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>대시보드</h2>
        <SendDigestButton />
      </div>

      {error ? (
        <p>불러오기 실패: {error.message}</p>
      ) : (
        <DashboardView summary={summary} />
      )}
    </main>
  );
}
