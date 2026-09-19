import AssistantWorkBoot from "../../../components/assistant-work/AssistantWorkBoot";

export default function AssistantWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<AssistantWorkBoot /></>;
}