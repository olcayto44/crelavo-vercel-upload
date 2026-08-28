import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mobile App Builder — Crelavo",
  description: "Build and download a working Expo React Native mobile app source package.",
  alternates: { canonical: "/ai-mobile-app-builder" }
};

export default function MobileAppBuilderPage() {
  redirect("/dashboard/assistant-workspace?mode=project&category=mobile_app&idea=Mobile%20app%20builder");
}
