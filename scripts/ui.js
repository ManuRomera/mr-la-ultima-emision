import { MR_LUE } from "./constants.js";
import { LegacyDialog, rootElement } from "./compat.js";

export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

export function t(key) { return game.i18n?.localize?.(key) ?? key; }

export function notifyError(error) {
  console.error("MR-La Última Emisión", error);
  ui.notifications?.error?.(error?.message ?? String(error));
}

export function guard(fn) {
  return async function (...args) {
    try { return await fn.apply(this, args); }
    catch (error) { notifyError(error); return undefined; }
  };
}

const queues = new Map();
export function locked(key, fn) {
  const prior = queues.get(key) ?? Promise.resolve();
  const next = prior.catch(() => {}).then(fn);
  queues.set(key, next);
  return next.finally(() => { if (queues.get(key) === next) queues.delete(key); });
}

export function requireGM() {
  if (!game.user?.isGM) throw new Error("Esta acción corresponde al Locutor/GM.");
}

export function activateTabs(html, storageKey, fallback) {
  const root = rootElement(html);
  if (!root) return;
  const buttons = [...root.querySelectorAll("[data-mr-lue-tab-target]")];
  const panels = [...root.querySelectorAll("[data-mr-lue-tab-panel]")];
  if (!buttons.length || !panels.length) return;
  const key = `${MR_LUE.TAB_PREFIX}${storageKey}`;
  const available = new Set(panels.map((panel) => panel.dataset.mrLueTabPanel));
  const first = available.has(fallback) ? fallback : panels[0].dataset.mrLueTabPanel;
  const stored = localStorage.getItem(key);
  let active = available.has(stored) ? stored : first;

  const apply = (tab) => {
    active = available.has(tab) ? tab : first;
    for (const button of buttons) {
      const on = button.dataset.mrLueTabTarget === active;
      button.classList.toggle("active", on);
      button.setAttribute("aria-selected", String(on));
      button.tabIndex = on ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.dataset.mrLueTabPanel !== active;
    try { localStorage.setItem(key, active); } catch (_) {}
  };

  for (const button of buttons) {
    button.addEventListener("click", (event) => { event.preventDefault(); apply(button.dataset.mrLueTabTarget); });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const index = buttons.indexOf(button);
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : event.key === "ArrowRight" ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
      buttons[next].focus();
      apply(buttons[next].dataset.mrLueTabTarget);
    });
  }
  apply(active);
}

export async function confirmDialog({ title, body, confirmLabel } = {}) {
  const content = `<div class="mr-lue-confirm"><p>${esc(body ?? "")}</p></div>`;
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (DialogV2?.confirm) {
    return DialogV2.confirm({ window: { title }, classes: ["mr-la-ultima-emision", "mr-lue-dialog"], content, yes: { label: confirmLabel ?? t("MRLUE.Confirm") }, no: { label: t("MRLUE.Cancel") } });
  }
  return new Promise((resolve) => new LegacyDialog({
    title,
    content,
    buttons: {
      yes: { label: confirmLabel ?? t("MRLUE.Confirm"), callback: () => resolve(true) },
      no: { label: t("MRLUE.Cancel"), callback: () => resolve(false) }
    },
    default: "no",
    close: () => resolve(false)
  }).render(true));
}

let tooltip = null;
let tooltipTimer = null;
function hideTooltip() { clearTimeout(tooltipTimer); tooltipTimer = null; tooltip?.remove(); tooltip = null; }
function showTooltip(target) {
  const text = target?.dataset?.mrLueHelp;
  if (!text) return;
  hideTooltip();
  tooltip = document.createElement("div");
  tooltip.className = "mr-lue-context-tooltip";
  tooltip.textContent = text;
  document.body.append(tooltip);
  const rect = target.getBoundingClientRect();
  const own = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.max(8, Math.min(innerWidth - own.width - 8, rect.left))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(innerHeight - own.height - 8, rect.bottom + 8))}px`;
}

export function bindContextHelp(root) {
  root = rootElement(root);
  if (!root) return;
  for (const target of root.querySelectorAll("[data-mr-lue-help]")) {
    target.addEventListener("mouseenter", () => { tooltipTimer = setTimeout(() => showTooltip(target), 900); });
    target.addEventListener("mouseleave", hideTooltip);
    target.addEventListener("contextmenu", (event) => { event.preventDefault(); showTooltip(target); });
  }
}
