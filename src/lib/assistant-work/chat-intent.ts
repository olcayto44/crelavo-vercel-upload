/** Only standalone commands count as approval; mixed edits always revise the plan. */
export function workspaceChatIntent(message: string): "approve" | "render" | "revise" {
  const text = message.trim().toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0131/g, "i").replace(/[.!?]+$/g, "").replace(/\s+/g, " ");
  if (/^(onayliyorum|onayli|onay|plani onayliyorum|bu plani onayliyorum|onay veriyorum|i approve|approve|approve plan|i approve the plan|approved)$/.test(text)) return "approve";
  if (/^(uretimi baslat|uretime basla|uretime gec|render final|start production|start rendering)$/.test(text)) return "render";
  return "revise";
}
