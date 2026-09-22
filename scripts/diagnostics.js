import { MR_LUE } from "./constants.js";
import { getControllerJournal, getPublicState } from "./state.js";

export async function runDiagnostics({ copy = false } = {}) {
  const publicState = getPublicState();
  const report = [
    "MR-La Última Emisión · Diagnóstico",
    `Módulo: ${game.modules?.get(MR_LUE.ID)?.version ?? "?"}`,
    `Foundry: ${game.version ?? game.release?.version ?? "?"}`,
    `Sistema activo: ${game.system?.id ?? "?"} ${game.system?.version ?? ""}`,
    `Usuario: ${game.user?.name ?? "?"} · GM=${Boolean(game.user?.isGM)}`,
    `Control privado: ${Boolean(getControllerJournal())}`,
    `Emisión: ${publicState.onAir ? "ON AIR" : "OFF AIR"}`,
    `Señal: ${publicState.signal}/${publicState.signalMax}`,
    `Overlay: ${publicState.overlay.visible ? "visible" : "oculto"} · ${publicState.overlay.locked ? "bloqueado" : "móvil"}`
  ].join("\n");
  console.info(report);
  if (copy && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(report);
    ui.notifications?.info?.("Diagnóstico copiado al portapapeles.");
  }
  return report;
}
