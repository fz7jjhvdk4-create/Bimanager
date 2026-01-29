import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth configuration.
 * This file does NOT import Prisma, making it safe for Edge Runtime (middleware).
 * The full auth.ts file extends this with the Prisma adapter for server-side use.
 */
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes that don't require login
      const publicRoutes = ["/login", "/register"];
      const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
      );

      // Auth API routes need to be public
      const isAuthApi = pathname.startsWith("/api/auth");

      if (!isLoggedIn && !isPublicRoute && !isAuthApi) {
        return false; // Redirect to login
      }

      if (isLoggedIn && isPublicRoute) {
        return Response.redirect(new URL("/", nextUrl.origin));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
