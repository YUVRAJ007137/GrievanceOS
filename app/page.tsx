import Link from "next/link";
import { getSessionData } from "@/lib/session";

export default async function HomePage() {
  const session = await getSessionData();

  let dashboardHref = "/login";
  if (session) {
    const base = `/org/${session.orgSlug}`;
    switch (session.role) {
      case "org_admin":
        dashboardHref = `${base}/admin`;
        break;
      case "dept_admin":
        dashboardHref = `${base}/dept/${session.departmentId}`;
        break;
      default:
        dashboardHref = base;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 bg-base-50/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <span className="text-xl font-bold tracking-tight text-accent">
          GrievanceOS
        </span>
        <div className="flex items-center gap-3">
          {session ? (
            <Link href={dashboardHref} className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-ghost">
              Log in
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative">
        <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-1.5 text-sm font-medium text-accent mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Open-source grievance platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Resolve grievances.{" "}
            <span className="text-accent">
              Track progress.
            </span>{" "}
            Stay accountable.
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            A single place to log, route, and close complaints — for
            organizations that take feedback seriously.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <Link href={dashboardHref} className="btn-primary px-8 py-3.5 text-base">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/setup" className="btn-primary px-8 py-3.5 text-base">
                  Create Organization
                </Link>
                <Link href="/login" className="btn-ghost px-8 py-3.5 text-base border-border-light text-white">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-gray-500 border-t border-border">
        GrievanceOS — Built for accountability
      </footer>
    </div>
  );
}
