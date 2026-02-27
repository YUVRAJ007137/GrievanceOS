import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "grievanceos-session",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const res = NextResponse.next();

  const session = await getIronSession<SessionData>(
    request,
    res,
    sessionOptions
  );

  const isLoggedIn = !!session.id;
  const isAuthPage = pathname === "/login" || pathname.match(/^\/org\/[^/]+\/register$/);
  const isProtected = pathname.startsWith("/org/");

  if (isAuthPage && isLoggedIn) {
    const dest = getDashboardUrl(session);
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (isProtected && !isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isProtected && !isAuthPage && isLoggedIn) {
    const slugMatch = pathname.match(/^\/org\/([^/]+)/);
    if (slugMatch && slugMatch[1] !== session.orgSlug) {
      const dest = getDashboardUrl(session);
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (pathname.includes("/admin") && session.role !== "org_admin") {
      const dest = getDashboardUrl(session);
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (pathname.includes("/dept/") && session.role !== "dept_admin") {
      const dest = getDashboardUrl(session);
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return res;
}

function getDashboardUrl(session: SessionData): string {
  const base = `/org/${session.orgSlug}`;
  switch (session.role) {
    case "org_admin":
      return `${base}/admin`;
    case "dept_admin":
      return `${base}/dept/${session.departmentId}`;
    default:
      return base;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
