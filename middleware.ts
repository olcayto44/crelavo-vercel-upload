import { NextRequest, NextResponse } from "next/server";

const PAGE_VERSION = "2026-08-22-133a320";
const VERSIONED_PATHS = new Set(["/live-sales-credits", "/live-sales-credits-v2", "/dashboard/payment"]);

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if(pathname==="/dashboard/studio-v2"){const url=request.nextUrl.clone();const category=searchParams.get("category");url.pathname=category&&/^[a-z0-9_]{1,40}$/.test(category)?"/dashboard/studio/"+category.replace(/_/g,"-"):"/dashboard/studio";url.searchParams.delete("category");return NextResponse.redirect(url,307); }

  if (pathname === "/deployBuilder" || pathname.startsWith("/assistant/workspace/") || pathname.startsWith("/assistant-workstation-production/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.includes("ai-video-generator") ? "/ai-video-generator" : "/ai-mobile-app-builder";
    url.search = "";
    return NextResponse.redirect(url, 308);
  }

  if (!VERSIONED_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (searchParams.get("v") === PAGE_VERSION && pathname !== "/live-sales-credits-v2") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.searchParams.set("v", PAGE_VERSION);

  if (pathname === "/live-sales-credits-v2") {
    url.pathname = "/live-sales-credits";
  }

  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ["/dashboard/studio-v2", "/live-sales-credits", "/live-sales-credits-v2", "/dashboard/payment", "/deployBuilder", "/assistant/workspace/:path*", "/assistant-workstation-production/:path*"]
};