import { NextRequest, NextResponse } from "next/server";

/**
 * Injects request path into headers so server components (e.g. layout)
 * can access it for redirects with callbackUrl.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const callbackUrl = pathname + search;
  requestHeaders.set("x-callback-url", callbackUrl);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
