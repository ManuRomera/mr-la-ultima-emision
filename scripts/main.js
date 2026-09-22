import { MR_LUE } from "./constants.js";
import { findWindow, rootElement, safeRender } from "./compat.js";
import { StationApp } from "./station-app.js";
import { ListenerApp } from "./listener-app.js";
import { applyClientPreferences, ensureControllerJournal, getPublicState, ingestCallRequest, ingestPendingRequests, mutatePublicState, registerSettings } from "./state.js";
import { ensureOverlay, refreshOverlay } from "./overlay.js";
import { attachWindowTracking, clearRememberedWindows, detachWindowTracking } from "./window-state.js";
import { ensureUtilityMacros } from "./macros.js";
import { bindChatStyling } from "./chat.js";
import { runDiagnostics } from "./diagnostics.js";
import { guard, t } from "./ui.js";

export function openStation() {
  if (!game.user?.isGM) return ui.notifications?.warn?.("MR-La Última Emisión: la consola corresponde al Locutor/GM.");
  const existing = findWindow("mr-la-ultima-emision-station");
  return (existing ?? new StationApp()).render(true);
}

export function openListener() {
  const existing = findWindow("mr-la-ultima-emision-listener");
  return (existing ?? new ListenerApp()).render(true);
}

export async function toggleOverlay() {
  if (!game.user?.isGM) return ui.notifications?.warn?.("MR-La Última Emisión: solo el Locutor/GM puede controlar el panel público.");
  await mutatePublicState((state) => { state.overlay.visible = !state.overlay.visible; });
}

function installApi() {
  game.mrLaUltimaEmision = {
    openStation,
    openListener,
    toggleOverlay,
    getPublicState,
    diagnostics: runDiagnostics,
    resetWindowLayout: clearRememberedWindows,
    ensureMacros: ensureUtilityMacros
  };
}

function addTool(control, tool) {
  if (!control) return;
  if (Array.isArray(control.tools)) {
    if (!control.tools.some((entry) => entry.name === tool.name)) control.tools.push(tool);
    return;
  }
  if (control.tools instanceof Map) {
    if (!control.tools.has(tool.name)) control.tools.set(tool.name, tool);
    return;
  }
  if (control.tools && typeof control.tools === "object") {
    control.tools[tool.name] ??= tool;
  }
}

function bindSceneControls() {
  Hooks.on("getSceneControlButtons", (controls) => {
    const control = Array.isArray(controls)
      ? (controls.find((entry) => ["token", "tokens", "notes"].includes(entry.name)) ?? controls[0])
      : (controls?.tokens ?? controls?.token ?? controls?.notes ?? Object.values(controls ?? {})[0]);
    if (!control) return;

    const station = { name: "mr-lue-station", title: t("MRLUE.OpenStation"), icon: "fas fa-tower-broadcast", button: true, visible: Boolean(game.user?.isGM), onClick: openStation, onChange: () => openStation() };
    const listener = { name: "mr-lue-listener", title: t("MRLUE.OpenListener"), icon: "fas fa-headphones", button: true, visible: true, onClick: openListener, onChange: () => openListener() };
    const overlay = { name: "mr-lue-overlay", title: t("MRLUE.ToggleOverlay"), icon: "fas fa-radio", button: true, visible: Boolean(game.user?.isGM), onClick: toggleOverlay, onChange: () => toggleOverlay() };
    addTool(control, station);
    addTool(control, listener);
    addTool(control, overlay);
  });
}

function isOurs(app) {
  const classes = app?.options?.classes ?? [];
  return classes.includes?.(MR_LUE.ID) || classes.includes?.("mr-la-ultima-emision") || String(app?.id ?? "").startsWith("mr-la-ultima-emision");
}

function onRendered(app, html) {
  if (isOurs(app)) attachWindowTracking(app, html);
}

Hooks.once("init", () => {
  console.log("MR-La Última Emisión | Inicializando módulo 1.0.0");
  registerSettings();
  installApi();
  bindSceneControls();
  bindChatStyling();
});

Hooks.once("ready", async () => {
  applyClientPreferences();
  ensureOverlay();
  if (game.user?.isGM) {
    await ensureControllerJournal();
    await ingestPendingRequests();
    await ensureUtilityMacros();
  }
});

Hooks.on("createChatMessage", (message) => guard(() => ingestCallRequest(message))());
Hooks.on("renderApplication", onRendered);
Hooks.on("renderApplicationV2", onRendered);
Hooks.on("closeApplication", (app) => { if (isOurs(app)) detachWindowTracking(app); });
Hooks.on("closeApplicationV2", (app) => { if (isOurs(app)) detachWindowTracking(app); });

Hooks.on("mrLaUltimaEmisionPublicChanged", () => {
  refreshOverlay();
  const station = findWindow("mr-la-ultima-emision-station");
  const listener = findWindow("mr-la-ultima-emision-listener");
  if (station?.rendered) safeRender(station);
  if (listener?.rendered) safeRender(listener);
});

Hooks.on("mrLaUltimaEmisionPrivateChanged", () => {
  const station = findWindow("mr-la-ultima-emision-station");
  if (station?.rendered) safeRender(station);
});

Hooks.on("updateSetting", (setting) => {
  const key = String(setting?.key ?? "");
  if (setting?.namespace !== MR_LUE.ID && !key.startsWith(`${MR_LUE.ID}.`)) return;
  if (["largeText", "highContrast", "reducedMotion"].some((part) => key.endsWith(part))) applyClientPreferences();
});
