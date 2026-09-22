import { DEFAULT_PRIVATE_STATE, DEFAULT_PUBLIC_STATE, MR_LUE } from "./constants.js";
import { deepClone, mergeObject, randomID } from "./compat.js";
import { locked, requireGM, t } from "./ui.js";

function normalizePublic(raw) {
  const state = mergeObject(deepClone(DEFAULT_PUBLIC_STATE), deepClone(raw ?? {}), { inplace: false, recursive: true, overwrite: true, insertKeys: true });
  state.signalMax = Math.max(1, Math.min(12, Number(state.signalMax) || 6));
  state.signal = Math.max(0, Math.min(state.signalMax, Number(state.signal) || 0));
  state.overlay = mergeObject(deepClone(DEFAULT_PUBLIC_STATE.overlay), state.overlay ?? {}, { inplace: false, recursive: true });
  state.overlay.x = Math.max(0.02, Math.min(0.95, Number(state.overlay.x) || DEFAULT_PUBLIC_STATE.overlay.x));
  state.overlay.y = Math.max(0.02, Math.min(0.9, Number(state.overlay.y) || DEFAULT_PUBLIC_STATE.overlay.y));
  state.overlay.width = Math.max(320, Math.min(760, Number(state.overlay.width) || DEFAULT_PUBLIC_STATE.overlay.width));
  state.revision = Number(state.revision) || 0;
  return state;
}

function normalizePrivate(raw) {
  const state = mergeObject(deepClone(DEFAULT_PRIVATE_STATE), deepClone(raw ?? {}), { inplace: false, recursive: true, overwrite: true, insertKeys: true });
  state.calls = Array.isArray(state.calls) ? state.calls : [];
  state.processedRequests = Array.isArray(state.processedRequests) ? state.processedRequests.slice(-200) : [];
  state.privateNote = String(state.privateNote ?? "");
  return state;
}

export function registerSettings() {
  game.settings.register(MR_LUE.ID, "publicState", {
    name: "MR-La Última Emisión · Estado público",
    scope: "world",
    config: false,
    type: Object,
    default: deepClone(DEFAULT_PUBLIC_STATE),
    onChange: () => Hooks.callAll("mrLaUltimaEmisionPublicChanged")
  });
  game.settings.register(MR_LUE.ID, "largeText", { name: t("MRLUE.SettingsLargeText"), hint: t("MRLUE.SettingsLargeTextHint"), scope: "client", config: true, type: Boolean, default: false, onChange: applyClientPreferences });
  game.settings.register(MR_LUE.ID, "highContrast", { name: t("MRLUE.SettingsHighContrast"), hint: t("MRLUE.SettingsHighContrastHint"), scope: "client", config: true, type: Boolean, default: false, onChange: applyClientPreferences });
  game.settings.register(MR_LUE.ID, "reducedMotion", { name: t("MRLUE.SettingsReducedMotion"), hint: t("MRLUE.SettingsReducedMotionHint"), scope: "client", config: true, type: Boolean, default: false, onChange: applyClientPreferences });
  game.settings.register(MR_LUE.ID, "alias", { name: t("MRLUE.SettingsAlias"), scope: "client", config: false, type: String, default: "" });
  game.settings.register(MR_LUE.ID, "frequency", { name: t("MRLUE.SettingsFrequency"), scope: "client", config: false, type: String, default: "" });
}

export function applyClientPreferences() {
  const body = document.body;
  if (!body) return;
  body.classList.toggle("mr-lue-large-text", Boolean(game.settings.get(MR_LUE.ID, "largeText")));
  body.classList.toggle("mr-lue-high-contrast", Boolean(game.settings.get(MR_LUE.ID, "highContrast")));
  body.classList.toggle("mr-lue-reduced-motion", Boolean(game.settings.get(MR_LUE.ID, "reducedMotion")));
}

export function getPublicState() { return normalizePublic(game.settings.get(MR_LUE.ID, "publicState")); }

export async function setPublicState(next) {
  requireGM();
  const state = normalizePublic(next);
  state.revision += 1;
  await game.settings.set(MR_LUE.ID, "publicState", state);
  return state;
}

export function mutatePublicState(mutator) {
  requireGM();
  return locked("mr-lue-public", async () => {
    const state = getPublicState();
    const result = await mutator(state);
    await setPublicState(state);
    return result ?? state;
  });
}

export async function resetPublicState() {
  requireGM();
  await game.settings.set(MR_LUE.ID, "publicState", deepClone(DEFAULT_PUBLIC_STATE));
}

export async function ensureControllerJournal() {
  let journal = game.journal?.find((entry) => entry.getFlag?.(MR_LUE.ID, MR_LUE.CONTROLLER_FLAG));
  if (journal || !game.user?.isGM) return journal ?? null;
  journal = await JournalEntry.create({
    name: MR_LUE.CONTROL_JOURNAL,
    ownership: { default: 0 },
    flags: { [MR_LUE.ID]: { [MR_LUE.CONTROLLER_FLAG]: true, state: deepClone(DEFAULT_PRIVATE_STATE) } }
  });
  return journal;
}

export function getControllerJournal() {
  return game.journal?.find((entry) => entry.getFlag?.(MR_LUE.ID, MR_LUE.CONTROLLER_FLAG)) ?? null;
}

export async function getPrivateState() {
  const journal = getControllerJournal() ?? await ensureControllerJournal();
  return normalizePrivate(journal?.getFlag?.(MR_LUE.ID, "state") ?? {});
}

export function mutatePrivateState(mutator) {
  requireGM();
  return locked("mr-lue-private", async () => {
    const journal = getControllerJournal() ?? await ensureControllerJournal();
    if (!journal) throw new Error("No se ha podido crear el control privado de la emisora.");
    const state = normalizePrivate(journal.getFlag?.(MR_LUE.ID, "state") ?? {});
    const result = await mutator(state);
    await journal.setFlag(MR_LUE.ID, "state", state);
    Hooks.callAll("mrLaUltimaEmisionPrivateChanged");
    return result ?? state;
  });
}

export async function updateBroadcast({ stationName, programName, headline, statusLine } = {}) {
  return mutatePublicState((state) => {
    if (stationName != null) state.stationName = String(stationName).trim() || "MR Radio";
    if (programName != null) state.programName = String(programName).trim() || "La Última Emisión";
    if (headline != null) state.headline = String(headline).trim() || "La frecuencia está abierta.";
    if (statusLine != null) state.statusLine = String(statusLine).trim() || "En espera de llamadas";
  });
}

export function adjustSignal(delta) {
  return mutatePublicState((state) => { state.signal = Math.max(0, Math.min(state.signalMax, state.signal + Number(delta || 0))); });
}

export function setOnAir(onAir) {
  return mutatePublicState((state) => { state.onAir = Boolean(onAir); });
}

export async function addCall({ caller = "Voz desconocida", userId = "", frequency = "", note = "", requestId = "" } = {}) {
  requireGM();
  return mutatePrivateState((state) => {
    if (requestId && state.processedRequests.includes(requestId)) return null;
    const call = { id: randomID(), requestId, caller: String(caller || "Voz desconocida").trim(), userId: String(userId || ""), frequency: String(frequency || "").trim(), note: String(note || "").trim(), status: "pending", createdAt: Date.now(), closedAt: null };
    state.calls.push(call);
    if (requestId) state.processedRequests.push(requestId);
    state.processedRequests = state.processedRequests.slice(-200);
    return call;
  });
}

export async function startCall(id) {
  requireGM();
  let live = null;
  await mutatePrivateState((state) => {
    for (const call of state.calls) if (call.status === "live") { call.status = "resolved"; call.closedAt = Date.now(); }
    const call = state.calls.find((entry) => entry.id === id);
    if (!call) throw new Error("No se ha encontrado la llamada.");
    call.status = "live";
    live = deepClone(call);
  });
  await mutatePublicState((state) => {
    state.activeCall = { id: live.id, caller: live.caller, frequency: live.frequency, note: live.note };
    state.statusLine = `${t("MRLUE.LiveCall")}: ${live.caller}`;
  });
  return live;
}

export async function closeCall(id, status = "resolved") {
  requireGM();
  let call = null;
  await mutatePrivateState((state) => {
    call = state.calls.find((entry) => entry.id === id) ?? null;
    if (!call) return;
    call.status = status === "dropped" ? "dropped" : "resolved";
    call.closedAt = Date.now();
  });
  const publicState = getPublicState();
  if (publicState.activeCall?.id === id) {
    await mutatePublicState((state) => { state.activeCall = null; state.statusLine = "En espera de llamadas"; });
  }
  return call;
}

export function removeCall(id) {
  requireGM();
  return mutatePrivateState((state) => { state.calls = state.calls.filter((entry) => entry.id !== id); });
}

export function savePrivateNote(text) {
  requireGM();
  return mutatePrivateState((state) => { state.privateNote = String(text ?? ""); });
}

export async function emitInterference(text) {
  const clean = String(text ?? "").trim();
  if (!clean) return;
  return mutatePublicState((state) => { state.interference = { id: randomID(), text: clean, at: Date.now() }; state.statusLine = t("MRLUE.Interference"); });
}

export function clearInterference() {
  return mutatePublicState((state) => { state.interference = null; state.statusLine = state.activeCall ? `${t("MRLUE.LiveCall")}: ${state.activeCall.caller}` : "En espera de llamadas"; });
}

export function gmIds() { return (game.users ?? []).filter((u) => u.isGM).map((u) => u.id); }
export function primaryActiveGM() { return (game.users ?? []).filter((u) => u.isGM && u.active).sort((a, b) => String(a.id).localeCompare(String(b.id)))[0] ?? null; }

export async function sendCallRequest({ alias, frequency, note } = {}) {
  const requestId = randomID();
  const caller = String(alias || game.user?.name || "Oyente").trim();
  const cleanFrequency = String(frequency || "").trim();
  const cleanNote = String(note || "").trim();
  if (!cleanNote) throw new Error("Escribe primero qué quieres comunicar al Locutor.");
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker?.({ alias: caller }) ?? { alias: caller },
    whisper: gmIds(),
    content: `<article class="mr-lue-chat-request"><strong>${foundry.utils.escapeHTML?.(caller) ?? caller}</strong><p>${foundry.utils.escapeHTML?.(cleanNote) ?? cleanNote}</p></article>`,
    flags: { [MR_LUE.ID]: { callRequest: { requestId, userId: game.user?.id ?? "", caller, frequency: cleanFrequency, note: cleanNote } } }
  });
  return requestId;
}

export async function ingestCallRequest(message) {
  if (!game.user?.isGM || primaryActiveGM()?.id !== game.user.id) return false;
  const request = message?.getFlag?.(MR_LUE.ID, "callRequest");
  if (!request?.requestId) return false;
  await addCall(request);
  return true;
}

export async function ingestPendingRequests() {
  if (!game.user?.isGM || primaryActiveGM()?.id !== game.user.id) return;
  const messages = [...(game.messages ?? [])].slice(-200);
  for (const message of messages) if (message.getFlag?.(MR_LUE.ID, "callRequest")) await ingestCallRequest(message);
}
