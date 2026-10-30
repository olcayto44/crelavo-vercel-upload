import { redirect } from "next/navigation";

/** Legacy links now open the maintained assistant workspace. */
export default function CreatePage() {
  redirect("/dashboard/assistant-workspace");
}
