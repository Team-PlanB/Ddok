import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Ddok</h1>
        <p style={{ margin: "4px 0 0" }}>똑 부러지는 프로젝트 관리</p>
      </div>
      <LoginForm />
    </main>
  );
}
