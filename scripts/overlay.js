import { getPublicState, mutatePublicState } from "./state.js";
import { debounce } from "./compat.js";
import { esc, guard, t } from "./ui.js";

let root = null;
let drag = null;

function signalBars(state) {
  return Array.from({ length: state.signalMax }, (_, index) => `<span class="${index < state.signal ? "on" : ""}" aria-hidden="true"></span>`).join("");
}

function renderContent() {
  if (!root) return;
  const state = getPublicState();
  root.classList.toggle("hidden", !state.overlay.visible);
  root.classList.toggle("unlocked", Boolean(game.user?.isGM && !state.overlay.locked));
  root.classList.toggle("off-air", !state.onAir);
  root.style.width = `${state.overlay.width}px`;
  const left = Math.max(8, Math.min(innerWidth - state.overlay.width - 8, state.overlay.x * innerWidth));
  const top = Math.max(8, Math.min(innerHeight - 80, state.overlay.y * innerHeight));
  root.style.left = `${Math.round(left)}px`;
  root.style.top = `${Math.round(top)}px`;
  root.innerHTML = `<div class="mr-lue-overlay-shell">
    <header class="mr-lue-overlay-drag" data-mr-lue-help="${game.user?.isGM ? "Desbloquea el panel desde Herramientas para moverlo." : ""}">
      <div><span class="mr-lue-live-dot"></span> ${esc(state.stationName)}</div><small>${esc(state.onAir ? t("MRLUE.OnAir") : t("MRLUE.OffAir"))}</small>
    </header>
    <div class="mr-lue-overlay-program">${esc(state.programName)}</div>
    <section class="mr-lue-overlay-signal" aria-label="${esc(t("MRLUE.Signal"))} ${state.signal} / ${state.signalMax}"><div>${signalBars(state)}</div><b>${state.signal}/${state.signalMax}</b></section>
    <h2>${esc(state.headline)}</h2>
    <p class="mr-lue-overlay-status">${esc(state.statusLine)}</p>
    ${state.activeCall ? `<section class="mr-lue-overlay-call"><span>${esc(t("MRLUE.LiveCall").toUpperCase())}</span><strong>${esc(state.activeCall.caller)}</strong>${state.activeCall.frequency ? `<small>${esc(state.activeCall.frequency)}</small>` : ""}${state.activeCall.note ? `<p>${esc(state.activeCall.note)}</p>` : ""}</section>` : ""}
    ${state.interference ? `<section class="mr-lue-overlay-interference"><b>${esc(t("MRLUE.Interference").toUpperCase())}</b><p>${esc(state.interference.text)}</p></section>` : ""}
    ${game.user?.isGM ? `<footer><button type="button" data-overlay-lock><i class="fas ${state.overlay.locked ? "fa-lock" : "fa-lock-open"}"></i> ${esc(state.overlay.locked ? t("MRLUE.Unlock") : t("MRLUE.Lock"))}</button></footer>` : ""}
  </div>`;
  root.querySelector("[data-overlay-lock]")?.addEventListener("click", guard(async () => mutatePublicState((next) => { next.overlay.locked = !next.overlay.locked; })));
}

const savePosition = debounce(async () => {
  if (!drag || !game.user?.isGM || !root) return;
  const rect = root.getBoundingClientRect();
  drag = null;
  await mutatePublicState((state) => {
    state.overlay.x = Math.max(0.02, Math.min(0.95, rect.left / Math.max(innerWidth, 1)));
    state.overlay.y = Math.max(0.02, Math.min(0.9, rect.top / Math.max(innerHeight, 1)));
  });
}, 80);

function onPointerDown(event) {
  const state = getPublicState();
  if (!game.user?.isGM || state.overlay.locked || !event.target.closest?.(".mr-lue-overlay-drag")) return;
  const rect = root.getBoundingClientRect();
  drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
  root.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}
function onPointerMove(event) {
  if (!drag) return;
  root.style.left = `${Math.max(8, Math.min(Math.max(8, innerWidth - root.offsetWidth - 8), event.clientX - drag.dx))}px`;
  root.style.top = `${Math.max(8, Math.min(Math.max(8, innerHeight - root.offsetHeight - 8), event.clientY - drag.dy))}px`;
}
function onPointerUp() { if (drag) savePosition(); }

export function ensureOverlay() {
  if (!root) {
    root = document.createElement("aside");
    root.id = "mr-lue-public-overlay";
    root.className = "mr-la-ultima-emision mr-lue-public-overlay";
    root.setAttribute("aria-live", "polite");
    document.body.append(root);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerUp);
  }
  renderContent();
  return root;
}

export function refreshOverlay() { return root ? renderContent() : ensureOverlay(); }
export function destroyOverlay() { root?.remove(); root = null; }
