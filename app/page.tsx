import AddTaskForm from "@/components/AddTaskForm";
import TasksTable from "@/components/TasksTable";
import { createClient } from "@/lib/supabase/server";
import { sortForChecklist, type Task } from "@/lib/tasks";

export default async function ChecklistPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  // 화면(sort_order) → 역할(기획→백엔드→디자인→프론트) 순으로 정렬.
  const tasks = sortForChecklist((data ?? []) as Task[]);

  return (
    <main className="page" style={{ maxWidth: 880 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
        체크리스트
      </h2>

      <div style={{ marginBottom: 16 }}>
        <AddTaskForm />
      </div>

      {error ? (
        <p>불러오기 실패: {error.message}</p>
      ) : (
        <TasksTable tasks={tasks} />
      )}
    </main>
  );
}
