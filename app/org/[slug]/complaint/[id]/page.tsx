"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Complaint = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  department_id: number | null;
  created_at: string;
  updated_at: string;
};

type Response = {
  id: number;
  author_type: string;
  message: string;
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

export default function ComplaintDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const load = useCallback(async () => {
    const [cRes, rRes] = await Promise.all([
      fetch(`/api/complaints/${complaintId}`),
      fetch(`/api/complaints/${complaintId}/responses`),
    ]);
    const cData = await cRes.json();
    const rData = await rRes.json();
    setComplaint(cData.complaint ?? null);
    setResponses(rData.responses ?? []);
    setLoading(false);
  }, [complaintId]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendReply() {
    if (!replyText.trim()) return;
    setReplying(true);
    const res = await fetch(`/api/complaints/${complaintId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyText.trim() }),
    });
    const data = await res.json();
    if (data.response) {
      setResponses((prev) => [...prev, data.response]);
      setReplyText("");
    }
    setReplying(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="dash-page">
        <div className="max-w-3xl mx-auto text-center py-20">
          <h1 className="text-2xl font-bold text-white">Complaint not found</h1>
          <Link href={`/org/${slug}`} className="mt-4 inline-block text-accent hover:text-accent-500 font-medium">
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href={`/org/${slug}`} className="inline-flex items-center text-sm text-gray-500 hover:text-white transition-colors">
          &larr; Back to dashboard
        </Link>

        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-white">{complaint.title}</h1>
            <div className="flex gap-2">
              <span className={statusMap[complaint.status] ?? "badge"}>{complaint.status.replace("_", " ")}</span>
              <span className={`${priorityMap[complaint.priority] ?? "badge"} capitalize`}>{complaint.priority}</span>
            </div>
          </div>
          <p className="mt-4 text-gray-300 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span>Submitted {new Date(complaint.created_at).toLocaleString()}</span>
            <span>Updated {new Date(complaint.updated_at).toLocaleString()}</span>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Responses ({responses.length})
          </h2>

          {responses.length > 0 ? (
            <div className="space-y-3">
              {responses.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge capitalize ${authorColors[r.author_type] ?? authorColors.user}`}>
                      {r.author_type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{r.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-gray-500">No responses yet. Your complaint is being reviewed.</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add a comment…"
              className="input flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
            />
            <button
              onClick={sendReply}
              disabled={replying || !replyText.trim()}
              className="btn-primary"
            >
              {replying ? "…" : "Send"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
