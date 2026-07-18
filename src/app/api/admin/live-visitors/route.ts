import { isAdminRequest } from "@/lib/admin-guard";
import { getLiveVisitorSnapshot } from "@/lib/live-visitors";
import { noStoreJson } from "@/lib/security";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return noStoreJson({ error: "Admin access required." }, { status: 403 });

  return noStoreJson(getLiveVisitorSnapshot());
}
