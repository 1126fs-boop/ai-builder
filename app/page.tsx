import { redirect } from "next/navigation";

/** ルート `/` は常にメインアプリ（静的 SPA）へ。認証は middleware が担当。 */
export default function Home() {
  redirect("/index.html");
}
