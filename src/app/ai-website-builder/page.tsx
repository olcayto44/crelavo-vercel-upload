import type { Metadata } from "next";
import { redirect } from "next/navigation";
export const metadata: Metadata = {
  title: "Crelavo AI Website Builder",
  description: "Design and build a website in Crelavo Studio V2.",
  alternates: { canonical: "/ai-website-builder" }
};
export default function Page() {
  redirect("/dashboard/studio-v2?category=website");
}
