"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Template = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  prompt_body: string;
  is_active: boolean;
  sort_order: number;
};

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  official_url: string;
  official_image_url: string | null;
  has_official_image: boolean;
  is_active: boolean;
};

export default function AdminPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<"templates" | "products">("templates");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    if (tab === "templates") {
      const { data } = await supabase.from("templates").select("*").order("sort_order");
      setTemplates(data || []);
    } else {
      const { data } = await supabase.from("products").select("*").order("sort_order");
      setProducts(data || []);
    }
    setLoading(false);
  }

  async function saveTemplate(t: Partial<Template> & { id?: string }) {
    if (t.id) {
      await supabase.from("templates").update(t).eq("id", t.id);
    } else {
      await supabase.from("templates").insert({
        category: t.category || "sales",
        name: t.name || "新規テンプレート",
        description: t.description,
        prompt_body: t.prompt_body || "",
        sort_order: templates.length + 1,
      });
    }
    loadData();
  }

  async function deleteTemplate(id: string) {
    if (!confirm("このテンプレートを削除しますか？")) return;
    await supabase.from("templates").delete().eq("id", id);
    loadData();
  }

  async function saveProduct(p: Product) {
    await supabase.from("products").upsert(p);
    loadData();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("ai_builder_saved_email");
    }
    window.location.href = "/login";
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <span className="admin__badge">管理者</span>
          <h1>AI Builder 管理</h1>
        </div>
        <nav className="admin__nav">
          <a href="/index.html" className="admin__link">← アプリへ</a>
          <button type="button" onClick={handleLogout} className="admin__logout">ログアウト</button>
        </nav>
      </header>

      <div className="admin__tabs">
        <button type="button" className={tab === "templates" ? "active" : ""} onClick={() => setTab("templates")}>
          共通テンプレート
        </button>
        <button type="button" className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>
          商品情報
        </button>
      </div>

      {loading ? (
        <p className="admin__loading">読み込み中...</p>
      ) : tab === "templates" ? (
        <section className="admin__section">
          <div className="admin__section-head">
            <h2>共通テンプレート</h2>
            <button type="button" onClick={() => saveTemplate({ category: "sales", name: "新規テンプレート", prompt_body: "" })}>
              ＋ 追加
            </button>
          </div>
          {templates.map((t) => (
            <div key={t.id} className="admin__card">
              <input defaultValue={t.name} onBlur={(e) => saveTemplate({ ...t, name: e.target.value })} className="admin__input" />
              <input defaultValue={t.category} onBlur={(e) => saveTemplate({ ...t, category: e.target.value })} className="admin__input admin__input--sm" placeholder="カテゴリ" />
              <textarea defaultValue={t.prompt_body} onBlur={(e) => saveTemplate({ ...t, prompt_body: e.target.value })} className="admin__textarea" rows={4} />
              <div className="admin__card-actions">
                <label><input type="checkbox" checked={t.is_active} onChange={(e) => saveTemplate({ ...t, is_active: e.target.checked })} /> 公開</label>
                <button type="button" onClick={() => deleteTemplate(t.id)} className="admin__delete">削除</button>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="admin__section">
          <h2>商品情報（公式HP準拠）</h2>
          <p className="admin__note">画像生成機能のみがこの商品情報を参照します。</p>
          {products.map((p) => (
            <div key={p.id} className="admin__card">
              <strong>{p.name}</strong>
              <input defaultValue={p.description} onBlur={(e) => saveProduct({ ...p, description: e.target.value })} className="admin__input" />
              <input defaultValue={p.official_image_url || ""} onBlur={(e) => saveProduct({ ...p, official_image_url: e.target.value || null, has_official_image: Boolean(e.target.value) })} className="admin__input" placeholder="公式画像URL" />
              <label><input type="checkbox" checked={p.is_active} onChange={(e) => saveProduct({ ...p, is_active: e.target.checked })} /> 公開</label>
            </div>
          ))}
        </section>
      )}

      <style jsx>{`
        .admin { max-width: 800px; margin: 0 auto; padding: 24px 16px 48px; }
        .admin__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .admin__badge { font-size: 0.7rem; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 10px; border-radius: 9999px; }
        .admin__header h1 { font-size: 1.5rem; margin-top: 8px; }
        .admin__nav { display: flex; gap: 12px; align-items: center; }
        .admin__link { color: #2563eb; text-decoration: none; font-size: 0.9rem; }
        .admin__logout { background: none; border: 1px solid #ececf1; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
        .admin__tabs { display: flex; gap: 8px; margin-bottom: 20px; }
        .admin__tabs button { padding: 10px 18px; border: 1px solid #ececf1; border-radius: 9999px; background: #fff; cursor: pointer; font-size: 0.875rem; }
        .admin__tabs button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
        .admin__section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .admin__section-head button { background: #2563eb; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; }
        .admin__card { background: #fff; border: 1px solid #ececf1; border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px; }
        .admin__input, .admin__textarea { width: 100%; padding: 10px 12px; border: 1px solid #ececf1; border-radius: 8px; font-size: 0.9rem; font-family: inherit; }
        .admin__input--sm { max-width: 160px; }
        .admin__card-actions { display: flex; justify-content: space-between; align-items: center; }
        .admin__delete { color: #dc2626; background: none; border: none; cursor: pointer; font-size: 0.85rem; }
        .admin__note { font-size: 0.85rem; color: #6e6e80; margin-bottom: 16px; }
        .admin__loading { text-align: center; color: #6e6e80; padding: 40px; }
      `}</style>
    </div>
  );
}
