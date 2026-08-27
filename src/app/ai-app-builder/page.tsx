import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "AI App Builder — Crelavo",
  description: "Start the Crelavo AI App Builder workflow for SaaS MVPs, web apps, dashboards and admin panels.",
  alternates: { canonical: "/ai-app-builder" }
};

export default function Page() {
  redirect("/dashboard/assistant-workspace?mode=project&category=app&idea=AI%20App%20Builder");
}
