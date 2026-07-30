import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: "center" }}>読み込み中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
