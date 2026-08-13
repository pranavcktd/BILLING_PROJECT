import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const isLoginPage = nextUrl.pathname === "/login";
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");
  const isAdvocateRoute =
    !isPortalRoute && !isLoginPage && nextUrl.pathname !== "/";

  if (isLoginPage) {
    if (isLoggedIn) {
      const dest = role === "CLIENT" ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isPortalRoute && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isAdvocateRoute && role !== "ADVOCATE") {
    return NextResponse.redirect(new URL("/portal", nextUrl));
  }

  if (
    role === "CLIENT" &&
    session?.user?.mustChangePassword &&
    nextUrl.pathname !== "/portal/change-password"
  ) {
    return NextResponse.redirect(new URL("/portal/change-password", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
