import { NextRequest, NextResponse } from "next/server";

const PAGE_VERSION = "2026-08-22-133a320";
const VERSIONED_PATHS = new Set(["/live-sales-credits", "/live-sales-credits-v2", "/dashboard/payment"]);

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

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
  matcher: ["/live-sales-credits", "/live-sales-credits-v2", "/dashboard/payment"]
};