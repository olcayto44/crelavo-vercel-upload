import { redirect } from "next/navigation";

export default function LegacyWhopCheckoutPage() {
  redirect("/checkout/unavailable");
}
