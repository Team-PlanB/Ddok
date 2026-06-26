import StatusMatrix from "@/components/StatusMatrix";
import SendBoardButton from "@/components/SendBoardButton";
import { createClient } from "@/lib/supabase/server";
import { buildMatrix, type Task } from "@/lib/tasks";

export default async function BoardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  const matrix = buildMatrix((data ?? []) as Task[]);

  return (
    <main className="page" style={{ maxWidth: 1000 }}>
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
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>현황판</h2>
        <SendBoardButton />
      </div>

      {error ? (
        <p>불러오기 실패: {error.message}</p>
      ) : (
        <StatusMatrix matrix={matrix} />
      )}
    </main>
  );
}
