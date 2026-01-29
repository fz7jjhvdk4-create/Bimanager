import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Publika routes som inte kräver inloggning
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // API routes för auth behöver vara publika
  const isAuthApi = pathname.startsWith("/api/auth");

  // Om användaren inte är inloggad och försöker nå en skyddad route
  if (!isLoggedIn && !isPublicRoute && !isAuthApi) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Om användaren är inloggad och försöker nå login/register
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Matcha alla routes utom:
     * - _next/static (statiska filer)
     * - _next/image (bild-optimering)
     * - favicon.ico (favicon)
     * - Statiska filer (bilder, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
