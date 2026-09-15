import { redirect } from "next/navigation";

export default function LegacyWhopBillingPage() {
  redirect("/dashboard/billing");
}
