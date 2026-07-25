import { getMubertAccount, getStableAudioAccount } from "@/lib/providers/music";

export async function GET(request: Request) {
  const provider = new URL(request.url).searchParams.get("provider") || "stable-audio";
  try {
    if (provider === "mubert") return Response.json({ provider, result: await getMubertAccount() });
    return Response.json({ provider: "stable-audio", result: await getStableAudioAccount() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Music provider request failed.";
    return Response.json({ provider, error: message }, { status: 500 });
  }
}
