import {isRetiredCategory,isRetiredCategoryPath} from "./src/lib/retired-categories";
import { NextRequest, NextResponse } from "next/server";

const PAGE_VERSION = "2026-08-22-133a320";
const VERSIONED_PATHS = new Set(["/live-sales-credits", "/live-sales-credits-v2", "/dashboard/payment"]);

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if(isRetiredCategoryPath(pathname))return new NextResponse('This product category has been retired.',{status:410,headers:{'Content-Type':'text/plain; charset=utf-8','X-Robots-Tag':'noindex, nofollow'}});
  if(pathname.startsWith('/dashboard/')&&(isRetiredCategory(searchParams.get('category'))||isRetiredCategory(searchParams.get('type')))){const url=request.nextUrl.clone();url.pathname='/dashboard/studio';url.search='';return NextResponse.redirect(url,307);}
  if(pathname==="/dashboard/studio-v2"){const url=request.nextUrl.clone();const category=searchParams.get("category");url.pathname=category&&/^[a-z0-9_]{1,40}$/.test(category)?"/dashboard/studio/"+category.replace(/_/g,"-"):"/dashboard/studio";url.searchParams.delete("category");return NextResponse.redirect(url,307); }

  if (pathname === "/deployBuilder" || pathname.startsWith("/assistant/workspace/") || pathname.startsWith("/assistant-workstation-production/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.includes("ai-video-generator") ? "/ai-video-generator" : "/ai-mobile-app-builder";
    url.search = "";
    return NextResponse.redirect(url, 308);
  }

  if (!VERSIONED_PATHS.has(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-crelavo-page-path", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
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
  matcher: ["/categories/:path*", "/admin-panel", "/pitch-deck-pdf", "/products/:path*", "/tools/:path*", "/dashboard/studio/:path*", "/dashboard/assistant-workspace/:path*", "/dashboard/create/:path*", "/admin-project", "/documentary", "/campaign-calendar", "/document-pack", "/animal-video", "/nature-video", "/planet-space-video", "/crelavo-academy", "/community-showcase", "/ai-campaign-calendar", "/ai-documentary-maker", "/ai-documentary-generator", "/ai-admin-panel-builder", "/admin-panel-builder", "/ai-animal-video", "/ai-animal-video-generator", "/ai-nature-video", "/ai-nature-video-generator", "/ai-planet-space-video", "/ai-space-video-generator", "/ai-document-pack", "/document-file-pack", "/ai-document-file-pack", "/ai-crelavo-academy", "/ai-community-showcase", "/tr/:path*", "/de/:path*", "/fr/:path*", "/zh/:path*", "/dashboard/studio-v2", "/live-sales-credits", "/live-sales-credits-v2", "/dashboard/payment", "/deployBuilder", "/assistant/workspace/:path*", "/assistant-workstation-production/:path*"]
};