import { MR_LUE } from "./constants.js";
import { LegacyApplication, mergeObject, rootElement } from "./compat.js";
import { activateTabs, bindContextHelp, confirmDialog, guard, requireGM, t } from "./ui.js";
import {
  addCall,
  adjustSignal,
  clearInterference,
  closeCall,
  emitInterference,
  getPrivateState,
  getPublicState,
  mutatePublicState,
  removeCall,
  resetPublicState,
  savePrivateNote,
  setOnAir,
  startCall,
  updateBroadcast
} from "./state.js";
import { broadcastChat } from "./chat.js";
import { clearRememberedWindows } from "./window-state.js";
import { ensureUtilityMacros } from "./macros.js";
import { runDiagnostics } from "./diagnostics.js";

function clean(value) { return String(value ?? "").trim(); }
function statusLabel(status) { return ({ resolved: "RESUELTA", dropped: "CORTADA", pending: "EN COLA", live: "EN ANTENA" })[status] ?? String(status ?? "").toUpperCase(); }

export class StationApp extends LegacyApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "mr-la-ultima-emision-station",
      title: "MR-La Última Emisión · Emisora",
      template: `modules/${MR_LUE.ID}/templates/station.hbs`,
      classes: [MR_LUE.ID, "mr-la-ultima-emision", "mr-lue-window", "mr-lue-station"],
      width: 1050,
      height: 790,
      minWidth: 790,
      minHeight: 620,
      resizable: true,
      popOut: true
    }, { inplace: false });
  }

  async getData() {
    requireGM();
    const publicState = getPublicState();
    const privateState = await getPrivateState();
    const calls = (privateState.calls ?? []).map((call) => ({ ...call, statusLabel: statusLabel(call.status) }));
    return {
      publicState,
      privateState,
      liveCall: calls.find((call) => call.status === "live") ?? null,
      pendingCalls: calls.filter((call) => call.status === "pending"),
      oldCalls: calls.filter((call) => ["resolved", "dropped"].includes(call.status)).sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0)),
      signalSegments: Array.from({ length: publicState.signalMax }, (_, index) => ({ on: index < publicState.signal }))
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    requireGM();
    const root = rootElement(html);
    activateTabs(root, "station", "broadcast");
    bindContextHelp(root);
    root?.addEventListener("click", guard(async (event) => {
      const button = event.target.closest?.("[data-action]");
      if (!button) return;
      event.preventDefault();
      await this._handleAction(button.dataset.action, button, root);
    }));
  }

  async _handleAction(action, button, root) {
    switch (action) {
      case "toggle-on-air":
        await setOnAir(!getPublicState().onAir);
        break;
      case "save-public": {
        await updateBroadcast({
          stationName: root.querySelector("[name='stationName']")?.value,
          programName: root.querySelector("[name='programName']")?.value,
          headline: root.querySelector("[name='headline']")?.value,
          statusLine: root.querySelector("[name='statusLine']")?.value
        });
        ui.notifications?.info?.("MR-La Última Emisión: emisión pública actualizada.");
        break;
      }
      case "signal-down": await adjustSignal(-1); break;
      case "signal-up": await adjustSignal(1); break;
      case "add-call": {
        const caller = clean(root.querySelector("[name='newCallCaller']")?.value) || "Voz desconocida";
        const frequency = clean(root.querySelector("[name='newCallFrequency']")?.value);
        const note = clean(root.querySelector("[name='newCallNote']")?.value);
        await addCall({ caller, frequency, note });
        break;
      }
      case "start-call": {
        const call = await startCall(button.dataset.id);
        await broadcastChat({ title: `${t("MRLUE.OnAir")} · ${call.caller}`, body: call.note || call.frequency || call.caller, tone: "call" });
        break;
      }
      case "close-call": await closeCall(button.dataset.id, "resolved"); break;
      case "drop-call": await closeCall(button.dataset.id, "dropped"); break;
      case "remove-call": await removeCall(button.dataset.id); break;
      case "emit-interference": {
        const text = clean(root.querySelector("[name='interferenceText']")?.value);
        await emitInterference(text);
        if (text) await broadcastChat({ title: t("MRLUE.Interference"), body: text, tone: "interference" });
        break;
      }
      case "clear-interference": await clearInterference(); break;
      case "save-private": await savePrivateNote(root.querySelector("[name='privateNote']")?.value ?? ""); break;
      case "toggle-overlay": await mutatePublicState((state) => { state.overlay.visible = !state.overlay.visible; }); break;
      case "toggle-overlay-lock": await mutatePublicState((state) => { state.overlay.locked = !state.overlay.locked; }); break;
      case "overlay-wider": await mutatePublicState((state) => { state.overlay.width = Math.min(760, state.overlay.width + 40); }); break;
      case "overlay-narrower": await mutatePublicState((state) => { state.overlay.width = Math.max(320, state.overlay.width - 40); }); break;
      case "center-overlay": await mutatePublicState((state) => { state.overlay.x = Math.max(0.02, 0.5 - (state.overlay.width / Math.max(innerWidth, 1)) / 2); state.overlay.y = 0.08; }); break;
      case "reset-public": {
        const ok = await confirmDialog({ title: t("MRLUE.ResetConfirmTitle"), body: t("MRLUE.ResetConfirmBody") });
        if (ok) await resetPublicState();
        break;
      }
      case "ensure-macros": await ensureUtilityMacros(); break;
      case "reset-windows": clearRememberedWindows(); break;
      case "diagnostics": await runDiagnostics({ copy: true }); break;
      default: return;
    }
    this.render(false);
  }
}
