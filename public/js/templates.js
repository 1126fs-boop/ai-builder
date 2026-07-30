/**
 * AI Builder v2.0 — 共通テンプレート
 */

import { getSupabase, isCloudEnabled } from "./supabaseClient.js";
import { getCategory } from "../categories.js";
import { esc } from "./ui.js";

/** @typedef {{id:string,category:string,name:string,description:string|null,prompt_body:string}} Template */

/** @type {Template[]} */
let _templates = [];

export async function loadTemplates() {
  _templates = [];
  if (!(await isCloudEnabled())) return _templates;

  const sb = await getSupabase();
  if (!sb) return _templates;

  const { data } = await sb
    .from("templates")
    .select("id, category, name, description, prompt_body")
    .eq("is_active", true)
    .order("sort_order");

  _templates = data || [];
  return _templates;
}

/** @returns {Template[]} */
export function getTemplates() {
  return _templates;
}

/** @param {HTMLElement} container @param {(t: Template) => void} onSelect */
export function renderTemplatesList(container, onSelect) {
  container.innerHTML = "";

  if (_templates.length === 0) {
    container.innerHTML = `<p class="templates-empty">共通テンプレートは管理者が登録すると表示されます</p>`;
    return;
  }

  _templates.forEach((t, i) => {
    const cat = getCategory(t.category);
    const el = document.createElement("button");
    el.type = "button";
    el.className = "template-item";
    el.style.animationDelay = `${i * 0.04}s`;
    el.innerHTML = `
      <span class="template-item__icon">${cat?.icon || "📋"}</span>
      <span class="template-item__body">
        <span class="template-item__title">${esc(t.name)}</span>
        <span class="template-item__meta">${esc(cat?.label || t.category)}${t.description ? ` · ${esc(t.description)}` : ""}</span>
      </span>
      <span class="template-item__arrow">→</span>
    `;
    el.addEventListener("click", () => onSelect(t));
    container.appendChild(el);
  });
}
