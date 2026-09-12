export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url") || "";
  let u: URL;
  try { u = new URL(raw); } catch {
    return Response.json({ ok: false, error: "url" }, { status: 400 });
  }
  const host = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || !/(^|\.)cdn\.minimax\.io$/.test(host)) {
    return Response.json({ ok: false, error: "host" }, { status: 400 });
  }
  const up = await fetch(u.toString(), { cache: "no-store" });
  if (!up.ok || !up.body) {
    return Response.json({ ok: false, error: "upstream" }, { status: 502 });
  }
  return new Response(up.body, {
    status: 200,
    headers: {
      "Content-Type": up.headers.get("content-type") || "video/mp4",
      "Cache-Control": "private, max-age=120"
    }
  });
}
