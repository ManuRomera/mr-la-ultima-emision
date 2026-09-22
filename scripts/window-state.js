import { MR_LUE } from "./constants.js";
import { debounce, rootElement } from "./compat.js";

const tracked = new WeakMap();

export function fitWindow(position = {}, viewport = {}) {
  const margin = 12;
  const vw = Math.max(320, Number(viewport.width) || globalThis.innerWidth || 1280);
  const vh = Math.max(240, Number(viewport.height) || globalThis.innerHeight || 720);
  const width = Math.min(Math.max(320, Number(position.width) || 640), Math.max(320, vw - margin * 2));
  const height = Math.min(Math.max(240, Number(position.height) || 520), Math.max(240, vh - margin * 2));
  const left = Math.min(Math.max(margin, Number(position.left) || margin), Math.max(margin, vw - width - margin));
  const top = Math.min(Math.max(margin, Number(position.top) || margin), Math.max(margin, vh - height - margin));
  return { left, top, width, height };
}

function keyFor(app) {
  const id = app?.options?.id ?? app?.id ?? app?.constructor?.name;
  return id ? `${MR_LUE.WINDOW_PREFIX}${id}` : null;
}

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch (_) { return null; }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

function capture(app) {
  const root = rootElement(app);
  if (!root) return null;
  const rect = root.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

export function attachWindowTracking(app, html) {
  if (tracked.has(app)) return;
  const key = keyFor(app);
  const root = rootElement(html) ?? rootElement(app);
  if (!key || !root) return;

  const saved = read(key);
  if (saved) {
    const next = fitWindow(saved, { width: innerWidth, height: innerHeight });
    app.setPosition?.(next);
  }

  const save = debounce(() => {
    const current = capture(app);
    if (current) write(key, fitWindow(current, { width: innerWidth, height: innerHeight }));
  }, 120);

  const observer = new ResizeObserver(save);
  observer.observe(root);
  window.addEventListener("pointerup", save);
  tracked.set(app, { observer, save });
}

export function detachWindowTracking(app) {
  const entry = tracked.get(app);
  if (!entry) return;
  entry.save();
  entry.observer?.disconnect?.();
  window.removeEventListener("pointerup", entry.save);
  tracked.delete(app);
}

export function clearRememberedWindows() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MR_LUE.WINDOW_PREFIX) || key?.startsWith(MR_LUE.TAB_PREFIX)) keys.push(key);
  }
  for (const key of keys) localStorage.removeItem(key);
  ui.notifications?.info?.("MR-La Última Emisión: disposición de ventanas restablecida.");
}
