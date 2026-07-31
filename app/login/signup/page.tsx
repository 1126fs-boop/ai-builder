import { Suspense } from "react";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: "center" }}>読み込み中...</div>}>
      <SignupForm />
    </Suspense>
  );
}
