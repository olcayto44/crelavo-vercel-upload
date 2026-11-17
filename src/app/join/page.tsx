import { JoinEntry } from "@/components/auth/JoinEntry";
export const dynamic = "force-dynamic";
export default function JoinPage() {
  const previewTesting = process.env.VERCEL_ENV === "preview" && process.env.WEBSITE_RUNTIME_ENABLED === "1";
  return <JoinEntry previewTesting={previewTesting} />;
}
