"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { FileAttachment, FilePreview } from "@/components/file-preview";

type Complaint = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  file_url: string | null;
  created_at: string;
};

type Response = {
  id: number;
  author_type: string;
  message: string;
  file_url: string | null;
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

const authorColors: Record<string, string> = {
  dept_admin: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  org_admin: "bg-accent/10 text-accent border border-accent/20",
  user: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
};

export default function DeptAdminDashboard() {
  const params = useParams();
  const deptId = params.deptId as string;
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, Response[]>>({});
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyFileUrl, setReplyFileUrl] = useState<string | null>(null);
  const [replyUploading, setReplyUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/complaints?department_id=${deptId}`);
    const data = await res.json();
    setComplaints(data.complaints ?? []);
    setLoading(false);
  }, [deptId]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFile(file: File) {
    setReplyUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) setReplyFileUrl(data.url);
    setReplyUploading(false);
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  }

  async function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setReplyText("");
    setReplyFileUrl(null);
    if (!responses[id]) {
      const res = await fetch(`/api/complaints/${id}/responses`);
      const data = await res.json();
      setResponses((prev) => ({ ...prev, [id]: data.responses ?? [] }));
    }
  }

  async function sendReply(complaintId: number) {
    if (!replyText.trim() && !replyFileUrl) return;
    setReplying(true);
    const res = await fetch(`/api/complaints/${complaintId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyText.trim(), file_url: replyFileUrl }),
    });
    const data = await res.json();
    if (data.response) {
      setResponses((prev) => ({
        ...prev,
        [complaintId]: [...(prev[complaintId] ?? []), data.response],
      }));
      setReplyText("");
      setReplyFileUrl(null);
    }
    setReplying(false);
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    in_progress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="dash-header">
          <h1>Department Dashboard</h1>
          <p>Manage complaints assigned to your department</p>
        </div>

        <div className="metric-grid">
          {[
            { label: "Total", value: stats.total, accent: "text-white" },
            { label: "Pending", value: stats.pending, accent: "text-yellow-400" },
            { label: "In Progress", value: stats.in_progress, accent: "text-blue-400" },
            { label: "Resolved", value: stats.resolved, accent: "text-green-400" },
          ].map((s) => (
            <div key={s.label} className="card-metric">
              <p className={`text-3xl font-extrabold ${s.accent}`}>{s.value}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Complaints</h2>
          {complaints.length > 0 ? (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div key={c.id} className="card !p-0 overflow-hidden animate-fade-in">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="text-left font-semibold text-white hover:text-accent transition-colors"
                        >
                          {c.title}
                        </button>
                        <p className="mt-1 text-sm text-gray-400 line-clamp-2">{c.description}</p>
                        {c.file_url && (
                          <>
                            <FileAttachment url={c.file_url} label="User attachment" />
                            <FilePreview url={c.file_url} />
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className={statusMap[c.status] ?? "badge"}>{c.status.replace("_", " ")}</span>
                        <span className={`${priorityMap[c.priority] ?? "badge"} capitalize`}>{c.priority}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Status:</span>
                        <select
                          value={c.status}
                          onChange={(e) => updateStatus(c.id, e.target.value)}
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

                  {expandedId === c.id && (
                    <div className="border-t border-border bg-surface-raised/50 p-5 space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300">Responses</h4>
                      {(responses[c.id] ?? []).length > 0 ? (
                        <div className="space-y-2">
                          {(responses[c.id] ?? []).map((r) => (
                            <div key={r.id} className="rounded-xl bg-surface border border-border p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`badge capitalize ${authorColors[r.author_type] ?? authorColors.user}`}>
                                  {r.author_type.replace("_", " ")}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(r.created_at).toLocaleString()}
                                </span>
                              </div>
                              {r.message && <p className="text-sm text-gray-300">{r.message}</p>}
                              {r.file_url && (
                                <>
                                  <FileAttachment url={r.file_url} />
                                  <FilePreview url={r.file_url} />
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No responses yet.</p>
                      )}

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a response…"
                            className="input flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendReply(c.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => sendReply(c.id)}
                            disabled={replying || (!replyText.trim() && !replyFileUrl)}
                            className="btn-primary"
                          >
                            {replying ? "…" : "Reply"}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer text-xs text-gray-500 hover:text-accent transition-colors">
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadFile(file);
                              }}
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                            />
                            {replyUploading ? "Uploading…" : "Attach file"}
                          </label>
                          {replyFileUrl && (
                            <span className="text-xs text-accent">
                              File attached{" "}
                              <button onClick={() => setReplyFileUrl(null)} className="text-gray-500 hover:text-red-400 ml-1">✕</button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">No complaints assigned to your department yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
