import { MR_LUE } from "./constants.js";
import { requireGM } from "./ui.js";

const defs = [
  { key: "station", name: "MR-La Última Emisión · Emisora", img: "icons/svg/sound.svg", command: "game.mrLaUltimaEmision.openStation();" },
  { key: "listener", name: "MR-La Última Emisión · Oyente", img: "icons/svg/eye.svg", command: "game.mrLaUltimaEmision.openListener();" },
  { key: "overlay", name: "MR-La Última Emisión · Panel público", img: "icons/svg/light.svg", command: "game.mrLaUltimaEmision.toggleOverlay();" }
];

async function ensureFolder() {
  let folder = game.folders?.find((entry) => entry.type === "Macro" && entry.name === MR_LUE.MACRO_FOLDER);
  if (!folder) folder = await Folder.create({ name: MR_LUE.MACRO_FOLDER, type: "Macro", sorting: "a" });
  return folder;
}

export async function ensureUtilityMacros() {
  requireGM();
  const folder = await ensureFolder();
  const result = [];
  for (const def of defs) {
    let macro = game.macros?.find((entry) => entry.getFlag?.(MR_LUE.ID, "utility") === def.key);
    const data = { name: def.name, type: "script", img: def.img, command: def.command, folder: folder.id, flags: { [MR_LUE.ID]: { utility: def.key } } };
    if (!macro) macro = await Macro.create(data);
    else if (macro.name !== data.name || macro.command !== data.command || macro.folder?.id !== folder.id) await macro.update(data);
    result.push(macro);
  }
  ui.notifications?.info?.(`MR-La Última Emisión: ${result.length} macros disponibles.`);
  return result;
}
