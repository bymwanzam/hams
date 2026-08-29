import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { roleHasModuleAccess } from "@/lib/access";

// Optimistic, fast role gate for every /dashboard/<slug>/... request — this
// covers page loads AND the POST requests Server Actions submit (they post
// back to the route that rendered them), so it also blocks a restricted
// role from invoking, say, a Pharmacy action from a Pharmacy page they
// can't see. It is not the only check: see the role check inside
// pharmacy/actions.ts for the "close to the data" layer the Next.js auth
// guide recommends alongside this.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  if (!match) return NextResponse.next();

  // No session at all: let the dashboard layout's own auth() check redirect
  // to /login, rather than this gate sending them somewhere role-specific.
  if (!req.auth?.user) return NextResponse.next();

  const slug = match[1];
  const role = (req.auth.user as { role?: string }).role;

  if (!roleHasModuleAccess(role, slug)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = `?restricted=${encodeURIComponent(slug)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
