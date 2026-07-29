export const ASSISTANT_WORKSPACE_MESSAGES_KEY = "clipora_assistant_workspace_messages";

export function clearAssistantWorkspaceSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ASSISTANT_WORKSPACE_MESSAGES_KEY);
  window.sessionStorage.removeItem(ASSISTANT_WORKSPACE_MESSAGES_KEY);
}
