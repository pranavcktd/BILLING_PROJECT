import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function roleHome(role: string | undefined) {
  if (role === "CLIENT") return "/portal";
  if (role === "SUPER_ADMIN") return "/super-admin";
  return "/dashboard";
}

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const isLoginPage = nextUrl.pathname === "/login";
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");
  const isSuperAdminRoute = nextUrl.pathname.startsWith("/super-admin");
  const isChangePasswordPage = nextUrl.pathname === "/change-password";
  const isAdvocateRoute =
    !isPortalRoute &&
    !isSuperAdminRoute &&
    !isChangePasswordPage &&
    !isLoginPage &&
    nextUrl.pathname !== "/";

  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(roleHome(role), nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isPortalRoute && role !== "CLIENT") {
    return NextResponse.redirect(new URL(roleHome(role), nextUrl));
  }

  if (isSuperAdminRoute && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(roleHome(role), nextUrl));
  }

  if (isChangePasswordPage && role === "CLIENT") {
    return NextResponse.redirect(new URL("/portal/change-password", nextUrl));
  }

  if (isAdvocateRoute && role !== "ADVOCATE") {
    return NextResponse.redirect(new URL(roleHome(role), nextUrl));
  }

  if (session?.user?.mustChangePassword) {
    if (role === "CLIENT" && nextUrl.pathname !== "/portal/change-password") {
      return NextResponse.redirect(new URL("/portal/change-password", nextUrl));
    }
    if (role !== "CLIENT" && nextUrl.pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
