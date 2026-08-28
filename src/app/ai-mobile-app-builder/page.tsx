import type { Metadata } from "next";
import { WorkAssistant } from "@/components/WorkAssistant";
import { WorkspaceErrorBoundary } from "@/components/WorkspaceErrorBoundary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mobile App Builder — Crelavo",
  description: "Build and download a working Expo React Native mobile app source package.",
  alternates: { canonical: "/ai-mobile-app-builder" }
};

export default function MobileAppBuilderPage() {
  return (
    <main className="omni-work-route">
      <WorkspaceErrorBoundary fallback={
        <section className="omni-fallback">
          <h1>Mobile App Builder</h1>
          <p>The mobile app workspace could not load in this browser session. Please refresh and try again.</p>
          <a className="btn" href="/ai-mobile-app-builder">Refresh workspace</a>
        </section>
      }>
        <WorkAssistant initialIdea="Mobile app builder" initialCategory="mobile_app" />
      </WorkspaceErrorBoundary>
    </main>
  );
}
