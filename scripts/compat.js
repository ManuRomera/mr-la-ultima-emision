const f = globalThis.foundry;

export const generation = Number(globalThis.game?.release?.generation ?? String(globalThis.game?.version ?? "13").split(".")[0] ?? 13);
export const LegacyApplication = f?.appv1?.api?.Application ?? globalThis.Application;
export const LegacyDialog = f?.appv1?.api?.Dialog ?? globalThis.Dialog;

export function deepClone(value) {
  if (f?.utils?.deepClone) return f.utils.deepClone(value);
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function mergeObject(original, other, options = {}) {
  if (f?.utils?.mergeObject) return f.utils.mergeObject(original, other, options);
  const target = options.inplace === false ? deepClone(original) : original;
  for (const [key, value] of Object.entries(other ?? {})) {
    if (value && typeof value === "object" && !Array.isArray(value)) target[key] = mergeObject(target[key] ?? {}, value, options);
    else target[key] = deepClone(value);
  }
  return target;
}

export function randomID(length = 16) {
  return f?.utils?.randomID?.(length) ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function debounce(fn, wait = 120) {
  if (f?.utils?.debounce) return f.utils.debounce(fn, wait);
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function rootElement(htmlOrApp) {
  const element = htmlOrApp?.element ?? htmlOrApp;
  return element instanceof HTMLElement ? element : element?.[0] ?? null;
}

export function openWindows() {
  if (globalThis.ui?.windows) return Object.values(ui.windows);
  const instances = f?.applications?.instances;
  return instances ? [...instances.values()] : [];
}

export function findWindow(id) {
  return openWindows().find((app) => app?.options?.id === id || app?.id === id);
}

export function isTextEditingInside(app) {
  const root = rootElement(app);
  const active = document.activeElement;
  if (!root || !active || !root.contains(active)) return false;
  return active.matches?.("input:not([type='button']):not([type='submit']), textarea, select, [contenteditable='true']") ?? false;
}

export function deferRenderUntilBlur(app) {
  if (app?._mrLuePendingRender || !isTextEditingInside(app)) return false;
  app._mrLuePendingRender = true;
  const active = document.activeElement;
  const release = () => {
    active?.removeEventListener?.("blur", release);
    if (!app._mrLuePendingRender) return;
    app._mrLuePendingRender = false;
    if (app.rendered) app.render(false);
  };
  active?.addEventListener?.("blur", release, { once: true });
  return true;
}

export function safeRender(app, force = false) {
  if (!app?.rendered && !force) return;
  if (isTextEditingInside(app)) return deferRenderUntilBlur(app);
  app.render(force);
}

export function onRenderChatMessage(handler) {
  const hook = generation >= 13 ? "renderChatMessageHTML" : "renderChatMessage";
  Hooks.on(hook, (message, html) => handler(message, rootElement(html)));
}
