import { auth } from "@/auth";

// Re-derives the current organization from the session on every call,
// rather than threading it through AsyncLocalStorage. This app tried
// AsyncLocalStorage first (guard functions calling `enterWith()` after
// `await auth()`), but that mutation reliably failed to propagate back to
// the caller once `auth()` was awaited inside a nested function — a
// reproducible Next.js/Node interaction, not a mistake in the call sites.
// `auth()` itself is reliably callable from any depth in a request (it's
// used that way throughout this codebase already via requireAdvocate/etc.),
// since it relies on Next.js's own request-scoped `cookies()`/`headers()`
// context rather than anything we manage ourselves — so re-deriving here
// on every tenant-scoped query is the robust choice, not a workaround.
export async function getCurrentOrgId(): Promise<string> {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) {
    throw new Error(
      "No tenant context available. The current session has no organizationId — this should never happen for ADVOCATE/CLIENT sessions reaching tenant-scoped data."
    );
  }
  return orgId;
}
