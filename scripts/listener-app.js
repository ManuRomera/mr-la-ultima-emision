import { MR_LUE } from "./constants.js";
import { LegacyApplication, mergeObject, rootElement } from "./compat.js";
import { bindContextHelp, guard, t } from "./ui.js";
import { getPublicState, sendCallRequest } from "./state.js";

export class ListenerApp extends LegacyApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "mr-la-ultima-emision-listener",
      title: "MR-La Última Emisión · Oyente",
      template: `modules/${MR_LUE.ID}/templates/listener.hbs`,
      classes: [MR_LUE.ID, "mr-la-ultima-emision", "mr-lue-window", "mr-lue-listener"],
      width: 660,
      height: 520,
      minWidth: 500,
      minHeight: 430,
      resizable: true,
      popOut: true
    }, { inplace: false });
  }

  async getData() {
    return {
      user: game.user,
      publicState: getPublicState(),
      alias: game.settings.get(MR_LUE.ID, "alias") || game.user?.name || "",
      frequency: game.settings.get(MR_LUE.ID, "frequency") || ""
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const root = rootElement(html);
    bindContextHelp(root);
    root?.addEventListener("click", guard(async (event) => {
      const button = event.target.closest?.("[data-action='request-call']");
      if (!button) return;
      event.preventDefault();
      const alias = String(root.querySelector("[name='alias']")?.value ?? "").trim() || game.user?.name || "Oyente";
      const frequency = String(root.querySelector("[name='frequency']")?.value ?? "").trim();
      const note = String(root.querySelector("[name='callNote']")?.value ?? "").trim();
      await game.settings.set(MR_LUE.ID, "alias", alias);
      await game.settings.set(MR_LUE.ID, "frequency", frequency);
      await sendCallRequest({ alias, frequency, note });
      const textarea = root.querySelector("[name='callNote']");
      if (textarea) textarea.value = "";
      ui.notifications?.info?.(t("MRLUE.CallSent"));
    }));
  }
}
