import { db } from "@/lib/db";
import { getSessionData } from "@/lib/session";
import Link from "next/link";

export default async function AdminDashboard({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSessionData();
  if (!session) return null;

  const [{ data: departments }, { data: complaints }, { data: deptAdmins }, { data: users }] =
    await Promise.all([
      db
        .from("departments")
        .select("id, name")
        .eq("organization_id", session.organizationId),
      db
        .from("complaints")
        .select("id, status")
        .eq("organization_id", session.organizationId),
      db
        .from("department_admins")
        .select("id")
        .eq("organization_id", session.organizationId),
      db
        .from("users")
        .select("id")
        .eq("organization_id", session.organizationId),
    ]);

  const allComplaints = complaints ?? [];
  const stats = {
    total: allComplaints.length,
    pending: allComplaints.filter((c) => c.status === "pending").length,
    in_progress: allComplaints.filter((c) => c.status === "in_progress").length,
    resolved: allComplaints.filter((c) => c.status === "resolved").length,
    closed: allComplaints.filter((c) => c.status === "closed").length,
  };

  const statCards = [
    { label: "Total Complaints", value: stats.total, accent: "text-white" },
    { label: "Pending", value: stats.pending, accent: "text-yellow-400" },
    { label: "In Progress", value: stats.in_progress, accent: "text-blue-400" },
    { label: "Resolved", value: stats.resolved, accent: "text-green-400" },
    { label: "Closed", value: stats.closed, accent: "text-gray-500" },
  ];

  const overviewCards = [
    { label: "Departments", value: departments?.length ?? 0, href: `/org/${params.slug}/admin/departments` },
    { label: "Dept Admins", value: deptAdmins?.length ?? 0, href: `/org/${params.slug}/admin/dept-admins` },
    { label: "Registered Users", value: users?.length ?? 0, href: "#" },
  ];

  return (
    <div className="dash-page">
      <div className="dash-container">
        <div className="dash-header">
          <h1>Admin Dashboard</h1>
          <p>Organization overview and management</p>
        </div>

        <div className="metric-grid-5">
          {statCards.map((s) => (
            <div key={s.label} className="card-metric">
              <p className={`text-3xl font-extrabold ${s.accent}`}>{s.value}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {overviewCards.map((c) => (
            <Link key={c.label} href={c.href} className="card-hover group">
              <p className="text-3xl font-extrabold text-white">{c.value}</p>
              <p className="text-sm font-medium text-gray-500 mt-1 group-hover:text-accent transition-colors">
                {c.label} &rarr;
              </p>
            </Link>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Complaints</h2>
            <Link
              href={`/org/${params.slug}/admin/complaints`}
              className="text-sm font-medium text-accent hover:text-accent-500"
            >
              View all &rarr;
            </Link>
          </div>
          <RecentComplaints organizationId={session.organizationId} slug={params.slug} />
        </section>
      </div>
    </div>
  );
}

async function RecentComplaints({
  organizationId,
  slug,
}: {
  organizationId: number;
  slug: string;
}) {
  const { data: complaints } = await db
    .from("complaints")
    .select("id, title, status, priority, created_at, department_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!complaints?.length) {
    return <p className="text-sm text-gray-500">No complaints yet.</p>;
  }

  return (
    <div className="card !p-0 overflow-hidden">
      <table className="table-dark">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c.id}>
              <td>
                <Link
                  href={`/org/${slug}/admin/complaints`}
                  className="font-medium text-white hover:text-accent transition-colors"
                >
                  {c.title}
                </Link>
              </td>
              <td>
                <StatusBadge status={c.status} />
              </td>
              <td>
                <PriorityBadge priority={c.priority} />
              </td>
              <td className="text-gray-500">
                {new Date(c.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "badge-pending",
    in_progress: "badge-progress",
    resolved: "badge-resolved",
    closed: "badge-closed",
  };
  return <span className={map[status] ?? "badge"}>{status.replace("_", " ")}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: "badge-low",
    medium: "badge-medium",
    high: "badge-high",
  };
  return <span className={`${map[priority] ?? "badge"} capitalize`}>{priority}</span>;
}
