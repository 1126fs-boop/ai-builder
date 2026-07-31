/**
 * AI会議 — メインアプリケーション
 */

import { MEETING_ROLES, getDiscussionRoles, getFacilitatorRole } from "./roles.js";
import { runMeeting } from "./discussionEngine.js";
import {
  saveMeeting,
  getMeetings,
  getMeetingById,
  deleteMeeting,
  formatMeetingDate,
} from "./meetingStorage.js";
import {
  esc,
  showToast,
  showMeetingView,
  renderRoleCard,
  renderMessageBubble,
  renderHistoryItem,
} from "./meetingUi.js";
import { initAuthBar } from "../authBar.js";

/** @type {Set<string>} */
let selectedRoleIds = new Set(
  MEETING_ROLES.filter((r) => !r.isFacilitator).map((r) => r.id)
);
selectedRoleIds.add("facilitator");

/** @type {object|null} */
let currentMeetingResult = null;

/** @type {boolean} */
let isRunning = false;

const DOM = {
  roleGrid: () => document.getElementById("role-grid"),
  topicInput: () => document.getElementById("meeting-topic"),
  btnStart: () => document.getElementById("btn-start-meeting"),
  btnSave: () => document.getElementById("btn-save-meeting"),
  btnNewMeeting: () => document.getElementById("btn-new-meeting"),
  discussionThread: () => document.getElementById("discussion-thread"),
  meetingStatus: () => document.getElementById("meeting-status"),
  meetingTopicDisplay: () => document.getElementById("meeting-topic-display"),
  historyList: () => document.getElementById("meeting-history-list"),
  btnShowHistory: () => document.getElementById("btn-show-history"),
  btnBackSetup: () => document.getElementById("btn-back-setup"),
  btnBackFromHistory: () => document.getElementById("btn-back-from-history"),
  btnBackToHistory: () => document.getElementById("btn-back-to-history"),
  historyDetail: () => document.getElementById("history-detail"),
  btnDeleteMeeting: () => document.getElementById("btn-delete-meeting"),
};

function renderRoleGrid() {
  const grid = DOM.roleGrid();
  if (!grid) return;

  grid.innerHTML = MEETING_ROLES.map((role) =>
    renderRoleCard(role, selectedRoleIds.has(role.id))
  ).join("");

  grid.querySelectorAll(".role-card__checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const id = e.target.value;
      const role = MEETING_ROLES.find((r) => r.id === id);
      if (role?.isFacilitator) return;

      if (e.target.checked) {
        selectedRoleIds.add(id);
      } else {
        selectedRoleIds.delete(id);
      }
      selectedRoleIds.add("facilitator");
      e.target.closest(".role-card")?.classList.toggle("role-card--selected", e.target.checked);
      updateStartButton();
    });
  });
}

function updateStartButton() {
  const btn = DOM.btnStart();
  if (!btn) return;
  const discussionCount = getDiscussionRoles([...selectedRoleIds]).length;
  btn.disabled = isRunning || discussionCount < 1;
  btn.textContent = discussionCount < 1
    ? "参加AIを1人以上選んでください"
    : isRunning
      ? "議論中..."
      : `${discussionCount}名のAIで会議を開始`;
}

function renderHistoryList() {
  const list = DOM.historyList();
  if (!list) return;

  const meetings = getMeetings().map((m) => ({
    ...m,
    datetimeFormatted: formatMeetingDate(m.datetime),
  }));

  if (!meetings.length) {
    list.innerHTML = `<p class="empty-state">保存された会議履歴はありません</p>`;
    return;
  }

  list.innerHTML = meetings.map(renderHistoryItem).join("");

  list.querySelectorAll(".history-item").forEach((item) => {
    item.addEventListener("click", () => openHistoryDetail(item.dataset.meetingId));
  });
}

function openHistoryDetail(id) {
  const meeting = getMeetingById(id);
  if (!meeting) return;

  const detail = DOM.historyDetail();
  if (!detail) return;

  const allMessages = [...(meeting.messages || [])];
  if (meeting.conclusion) allMessages.push(meeting.conclusion);

  detail.innerHTML = `
    <header class="history-detail__header">
      <h2 class="history-detail__title">${esc(meeting.title)}</h2>
      <p class="history-detail__meta">${esc(formatMeetingDate(meeting.datetime))} · ${esc((meeting.selectedRoleNames || []).join("、"))}</p>
    </header>
    <div class="discussion-thread">${allMessages.map(renderMessageBubble).join("")}</div>
  `;

  DOM.btnDeleteMeeting()?.setAttribute("data-delete-id", id);
  showMeetingView("history-detail");
}

function renderDiscussionMessage(msg) {
  const thread = DOM.discussionThread();
  if (!thread) return;
  thread.insertAdjacentHTML("beforeend", renderMessageBubble(msg));
  thread.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function startMeeting() {
  const topic = DOM.topicInput()?.value?.trim();
  if (!topic) {
    showToast("議題を入力してください");
    DOM.topicInput()?.focus();
    return;
  }

  const discussionRoles = getDiscussionRoles([...selectedRoleIds]);
  if (!discussionRoles.length) {
    showToast("参加AIを1人以上選んでください");
    return;
  }

  isRunning = true;
  updateStartButton();

  const thread = DOM.discussionThread();
  if (thread) thread.innerHTML = "";
  DOM.meetingTopicDisplay()?.replaceChildren(document.createTextNode(topic));
  DOM.meetingStatus()?.replaceChildren(document.createTextNode("AIが議論中です..."));
  DOM.btnSave()?.setAttribute("hidden", "");

  showMeetingView("discussion");

  /** @type {object[]} */
  const messages = [];
  let conclusion = null;

  try {
    const result = await runMeeting(
      topic,
      discussionRoles,
      (msg) => {
        renderDiscussionMessage(msg);
        if (msg.isConclusion) {
          conclusion = msg;
          DOM.meetingStatus()?.replaceChildren(document.createTextNode("議論が完了しました"));
        } else {
          messages.push(msg);
        }
      },
      400
    );

    conclusion = result.conclusion;
    currentMeetingResult = {
      title: topic,
      selectedRoleIds: [...selectedRoleIds],
      selectedRoleNames: [...selectedRoleIds]
        .map((id) => MEETING_ROLES.find((r) => r.id === id)?.name)
        .filter(Boolean),
      messages: result.messages,
      conclusion: result.conclusion,
    };

    DOM.btnSave()?.removeAttribute("hidden");
    showToast("会議が完了しました。保存できます。");
  } catch (err) {
    console.error("[meeting]", err);
    showToast("会議中にエラーが発生しました");
    DOM.meetingStatus()?.replaceChildren(document.createTextNode("エラーが発生しました"));
  } finally {
    isRunning = false;
    updateStartButton();
  }
}

function handleSaveMeeting() {
  if (!currentMeetingResult) {
    showToast("保存する会議結果がありません");
    return;
  }

  saveMeeting(currentMeetingResult);
  showToast("会議結果を保存しました");
  renderHistoryList();
}

function handleDeleteMeeting() {
  const id = DOM.btnDeleteMeeting()?.getAttribute("data-delete-id");
  if (!id) return;
  if (!confirm("この会議履歴を削除しますか？")) return;
  deleteMeeting(id);
  showToast("削除しました");
  renderHistoryList();
  showMeetingView("history");
}

function resetToSetup() {
  currentMeetingResult = null;
  const thread = DOM.discussionThread();
  if (thread) thread.innerHTML = "";
  DOM.btnSave()?.setAttribute("hidden", "");
  showMeetingView("setup");
}

async function init() {
  await initAuthBar();

  const facilitator = getFacilitatorRole();
  if (facilitator) selectedRoleIds.add(facilitator.id);

  renderRoleGrid();
  renderHistoryList();
  updateStartButton();

  DOM.btnStart()?.addEventListener("click", startMeeting);
  DOM.btnSave()?.addEventListener("click", handleSaveMeeting);
  DOM.btnNewMeeting()?.addEventListener("click", resetToSetup);
  DOM.btnShowHistory()?.addEventListener("click", () => {
    renderHistoryList();
    showMeetingView("history");
  });
  DOM.btnBackSetup()?.addEventListener("click", resetToSetup);
  DOM.btnBackFromHistory()?.addEventListener("click", () => showMeetingView("setup"));
  DOM.btnBackToHistory()?.addEventListener("click", () => {
    renderHistoryList();
    showMeetingView("history");
  });
  DOM.btnDeleteMeeting()?.addEventListener("click", handleDeleteMeeting);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", init);
