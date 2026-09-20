import { CinemaRouteGuard } from "@/components/assistant-work/AssistantPage";

export default function AssistantWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CinemaRouteGuard />
      {children}
    </>
  );
}
