import Link from "next/link";
import { getSessionData } from "@/lib/session";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const session = await getSessionData();

  if (!session) {
    return <>{children}</>;
  }

  const { slug } = params;

  const roleLabel: Record<string, string> = {
    org_admin: "Admin",
    dept_admin: "Dept Admin",
    user: "User",
  };

  const navLinks = getNavLinks(session.role, slug, session.departmentId);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-3.5 bg-base-50/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link
            href={navLinks[0]?.href ?? `/org/${slug}`}
            className="text-xl font-bold tracking-tight text-accent"
          >
            GrievanceOS
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-raised hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge bg-accent/10 text-accent border border-accent/20">
            {roleLabel[session.role] ?? session.role}
          </span>
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
              {session.fullName?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-300">
              {session.fullName}
            </span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-xl border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-gray-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function getNavLinks(
  role: string,
  slug: string,
  departmentId?: number
): { href: string; label: string }[] {
  const base = `/org/${slug}`;
  switch (role) {
    case "org_admin":
      return [
        { href: `${base}/admin`, label: "Dashboard" },
        { href: `${base}/admin/departments`, label: "Departments" },
        { href: `${base}/admin/dept-admins`, label: "Dept Admins" },
        { href: `${base}/admin/complaints`, label: "Complaints" },
        { href: `${base}/admin/invite`, label: "Invite" },
      ];
    case "dept_admin":
      return [
        { href: `${base}/dept/${departmentId}`, label: "Dashboard" },
      ];
    default:
      return [
        { href: base, label: "Dashboard" },
      ];
  }
}
