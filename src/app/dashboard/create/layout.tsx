import { CinemaRouteGuard } from "@/components/assistant-work/AssistantPage";
import { RequireFreeAccount } from "@/components/auth/RequireFreeAccount";

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CinemaRouteGuard />
      {children}
    </>
  );
}
