import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "E-commerce Builder — Crelavo",
  description: "Start building a storefront, product catalog, cart, checkout and admin delivery package.",
  alternates: { canonical: "/ai-ecommerce-builder" }
};

export default function Page() {
  redirect("/dashboard/assistant-workspace?mode=project&category=ecommerce&idea=E-commerce%20store%20builder");
}
