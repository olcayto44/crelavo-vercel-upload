import { redirect } from "next/navigation";

/** The legacy production screen is disabled until a replacement is approved. */
export default function CreatePage() {
  redirect("/dashboard");
}
