/**
 * AI会議 — UI ヘルパー
 */

/** HTML エスケープ */
export function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** トースト表示 */
export function showToast(message, duration = 2500) {
  let el = document.getElementById("meeting-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "meeting-toast";
    el.className = "meeting-toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("meeting-toast--visible");
  setTimeout(() => el.classList.remove("meeting-toast--visible"), duration);
}

/** ビュー切替 */
export function showMeetingView(name) {
  document.querySelectorAll("[data-meeting-view]").forEach((el) => {
    const active = el.dataset.meetingView === name;
    el.hidden = !active;
    el.classList.toggle("meeting-view--active", active);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** 役割選択カード HTML */
export function renderRoleCard(role, selected) {
  return `
    <label class="role-card${selected ? " role-card--selected" : ""}" data-role-id="${esc(role.id)}">
      <input type="checkbox" class="role-card__checkbox" value="${esc(role.id)}"${selected ? " checked" : ""}${role.isFacilitator ? " disabled checked" : ""}>
      <span class="role-card__icon" style="background:${esc(role.color)}20;color:${esc(role.color)}">${role.icon}</span>
      <span class="role-card__info">
        <span class="role-card__name">${esc(role.name)}</span>
        <span class="role-card__desc">${esc(role.description)}</span>
      </span>
    </label>`;
}

/** 発言バブル HTML */
export function renderMessageBubble(msg) {
  const isConclusion = msg.isConclusion;
  const roundBadge = msg.roundLabel
    ? `<span class="message-bubble__round">${esc(msg.roundLabel)}</span>`
    : "";
  return `
    <article class="message-bubble${isConclusion ? " message-bubble--conclusion" : ""}" style="--role-color:${esc(msg.roleColor)}">
      <header class="message-bubble__header">
        <span class="message-bubble__icon">${msg.roleIcon}</span>
        <span class="message-bubble__name">${esc(msg.roleName)}</span>
        ${roundBadge}
        ${isConclusion ? '<span class="message-bubble__badge">総合結論</span>' : `<span class="message-bubble__order">#${msg.order}</span>`}
      </header>
      <div class="message-bubble__body">${esc(msg.content).replace(/\n/g, "<br>")}</div>
    </article>`;
}

/** 発言バブルをDOMに追加（innerHTMLより高速・安全） */
export function appendMessageBubble(container, msg) {
  const isConclusion = msg.isConclusion;
  const article = document.createElement("article");
  article.className = `message-bubble${isConclusion ? " message-bubble--conclusion" : ""}`;
  article.style.setProperty("--role-color", msg.roleColor);

  const header = document.createElement("header");
  header.className = "message-bubble__header";

  const icon = document.createElement("span");
  icon.className = "message-bubble__icon";
  icon.textContent = msg.roleIcon;

  const name = document.createElement("span");
  name.className = "message-bubble__name";
  name.textContent = msg.roleName;

  header.append(icon, name);

  if (msg.roundLabel) {
    const round = document.createElement("span");
    round.className = "message-bubble__round";
    round.textContent = msg.roundLabel;
    header.appendChild(round);
  }

  if (isConclusion) {
    const badge = document.createElement("span");
    badge.className = "message-bubble__badge";
    badge.textContent = "総合結論";
    header.appendChild(badge);
  } else {
    const order = document.createElement("span");
    order.className = "message-bubble__order";
    order.textContent = `#${msg.order}`;
    header.appendChild(order);
  }

  const body = document.createElement("div");
  body.className = "message-bubble__body";
  body.textContent = msg.content;

  article.append(header, body);
  container.appendChild(article);
  return article;
}

/** スクロールを間引いて描画負荷を下げる */
let scrollRaf = 0;
export function scrollThreadToLatest(container) {
  cancelAnimationFrame(scrollRaf);
  scrollRaf = requestAnimationFrame(() => {
    container.lastElementChild?.scrollIntoView({ behavior: "auto", block: "nearest" });
  });
}

/** 履歴リスト項目 HTML */
export function renderHistoryItem(meeting) {
  const participantCount = meeting.selectedRoleNames?.length ?? meeting.selectedRoleIds?.length ?? 0;
  return `
    <button type="button" class="history-item" data-meeting-id="${esc(meeting.id)}">
      <span class="history-item__title">${esc(meeting.title)}</span>
      <span class="history-item__meta">${esc(meeting.datetimeFormatted || meeting.datetime)} · ${participantCount}名参加</span>
    </button>`;
}
