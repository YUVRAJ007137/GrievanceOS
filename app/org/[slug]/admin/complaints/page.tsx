"use client";

import { useState, useEffect, useCallback } from "react";

type Department = { id: number; name: string };
type Complaint = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  department_id: number | null;
  user_id: number;
  created_at: string;
};

const statusMap: Record<string, string> = {
  pending: "badge-pending",
  in_progress: "badge-progress",
  resolved: "badge-resolved",
  closed: "badge-closed",
};

const priorityMap: Record<string, string> = {
  low: "badge-low",
  medium: "badge-medium",
  high: "badge-high",
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const load = useCallback(async () => {
    const [cRes, dRes] = await Promise.all([
      fetch("/api/complaints"),
      fetch("/api/departments"),
    ]);
    const cData = await cRes.json();
    const dData = await dRes.json();
    setComplaints(cData.complaints ?? []);
    setDepartments(dData.departments ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateComplaint(id: number, updates: Record<string, unknown>) {
    await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await load();
  }

  const filtered = complaints.filter((c) => {
    if (filterDept !== "all" && String(c.department_id) !== filterDept) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterPriority !== "all" && c.priority !== filterPriority) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="dash-container">
        <div className="dash-header">
          <h1>All Complaints</h1>
          <p>{complaints.length} total</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="input !w-auto">
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input !w-auto">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="input !w-auto">
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="card animate-fade-in">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{c.title}</h3>
                    <p className="mt-1 text-sm text-gray-400 line-clamp-2">{c.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={statusMap[c.status] ?? "badge"}>{c.status.replace("_", " ")}</span>
                    <span className={`${priorityMap[c.priority] ?? "badge"} capitalize`}>{c.priority}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Dept:</span>
                    <select
                      value={c.department_id ?? ""}
                      onChange={(e) => updateComplaint(c.id, { department_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="input !w-auto !py-1 !px-2 !text-sm"
                    >
                      <option value="">Unassigned</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Status:</span>
                    <select
                      value={c.status}
                      onChange={(e) => updateComplaint(c.id, { status: e.target.value })}
                      className="input !w-auto !py-1 !px-2 !text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <span className="text-gray-500 ml-auto">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">No complaints match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
