import { CinemaRouteGuard } from "@/components/assistant-work/AssistantPage";

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CinemaRouteGuard />
      {children}
    </>
  );
}
