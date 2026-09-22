import { MR_LUE } from "./constants.js";
import { esc } from "./ui.js";
import { onRenderChatMessage } from "./compat.js";

export async function broadcastChat({ title = "MR-La Última Emisión", body = "", tone = "broadcast" } = {}) {
  const text = String(body ?? "").trim();
  if (!text) return null;
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker?.({ alias: title }) ?? { alias: title },
    content: `<article class="mr-lue-chat-card mr-lue-chat-${esc(tone)}"><header>${esc(title)}</header><div>${esc(text).replace(/\n/g, "<br>")}</div></article>`,
    flags: { [MR_LUE.ID]: { broadcast: true, tone } }
  });
}

export function bindChatStyling() {
  onRenderChatMessage((message, root) => {
    if (!root) return;
    if (message?.getFlag?.(MR_LUE.ID, "broadcast")) root.classList.add("mr-lue-chat-message");
    if (message?.getFlag?.(MR_LUE.ID, "callRequest")) root.classList.add("mr-lue-call-request-message");
  });
}
