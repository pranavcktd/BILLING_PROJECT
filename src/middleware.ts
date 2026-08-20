import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { MODULE_ROUTE_MAP, hasPermission } from "@/lib/permissions";

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
  const isForgotPasswordPage = nextUrl.pathname === "/forgot-password";
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");
  const isSuperAdminRoute = nextUrl.pathname.startsWith("/super-admin");
  const isChangePasswordPage = nextUrl.pathname === "/change-password";
  const isTeamManagementRoute = nextUrl.pathname.startsWith("/settings/team");
  const isAdvocateRoute =
    !isPortalRoute &&
    !isSuperAdminRoute &&
    !isChangePasswordPage &&
    !isLoginPage &&
    !isForgotPasswordPage &&
    nextUrl.pathname !== "/";

  if (isForgotPasswordPage) {
    return NextResponse.next();
  }

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

  // Team management is never a grantable module — a STAFF member with
  // settings:MANAGE editing permissions (including their own) would be
  // privilege escalation, so this is hard-gated ahead of the general
  // module-permission check below, regardless of what that check would say.
  if (isTeamManagementRoute && role !== "ADVOCATE") {
    return NextResponse.redirect(new URL(roleHome(role), nextUrl));
  }

  if (isAdvocateRoute && role !== "ADVOCATE" && role !== "STAFF") {
    return NextResponse.redirect(new URL(roleHome(role), nextUrl));
  }

  // Coarse, JWT-only page-reachability gate for STAFF (edge runtime — no
  // Prisma, so this necessarily uses the permissions snapshotted at login,
  // same constraint as every other JWT-cached session field here). It only
  // decides whether a route prefix is reachable at all; the actual
  // read/write authorization decision is made fresh per-request by
  // requireModulePermission() in auth-guard.ts, which never trusts this
  // snapshot.
  if (isAdvocateRoute && role === "STAFF") {
    const match = MODULE_ROUTE_MAP.find((m) => nextUrl.pathname.startsWith(m.prefix));
    if (match && !hasPermission(session.user.permissions, match.module, "VIEW")) {
      return NextResponse.redirect(new URL(roleHome(role), nextUrl));
    }
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
