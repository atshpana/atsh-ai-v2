import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/ar";
    return NextResponse.redirect(destination);
  }
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-locale", locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"] };
