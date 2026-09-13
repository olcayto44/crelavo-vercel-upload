import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crelavo Dashboard",
  description: "Production, credits, billing and post-launch tools.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  }
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
