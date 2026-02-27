"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { FileAttachment, FilePreview, FileUploadInput } from "@/components/file-preview";

type Department = { id: number; name: string };
type Complaint = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  department_id: number | null;
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

const authorColors: Record<string, string> = {
  dept_admin: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  org_admin: "bg-accent/10 text-accent border border-accent/20",
  user: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
};

export default function UserDashboard() {
  const params = useParams();
  const slug = params.slug as string;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, Response[]>>({});
  const [responseCounts, setResponseCounts] = useState<Record<number, number>>({});
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyFileUrl, setReplyFileUrl] = useState<string | null>(null);
  const [replyUploading, setReplyUploading] = useState(false);

  const [selectedDept, setSelectedDept] = useState<string>("");
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestedName, setAiSuggestedName] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    const [dRes, cRes] = await Promise.all([
      fetch("/api/departments"),
      fetch("/api/complaints"),
    ]);
    const dData = await dRes.json();
    const cData = await cRes.json();
    setDepartments(dData.departments ?? []);
    const loadedComplaints: Complaint[] = cData.complaints ?? [];
    setComplaints(loadedComplaints);
    setLoading(false);

    const counts: Record<number, number> = {};
    await Promise.all(
      loadedComplaints.map(async (c) => {
        const rRes = await fetch(`/api/complaints/${c.id}/responses`);
        const rData = await rRes.json();
        counts[c.id] = (rData.responses ?? []).length;
      })
    );
    setResponseCounts(counts);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFile(file: File, setUrl: (url: string) => void, setUpl: (v: boolean) => void) {
    setUpl(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) setUrl(data.url);
    setUpl(false);
  }

  function handleDescriptionChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 20 || departments.length === 0) {
      setAiSuggestedName(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setAiSuggesting(true);
      try {
        const payload = {
          description: value,
          departments: departments.map((d) => ({ id: d.id, name: d.name })),
        };
        const res = await fetch("/api/ai/suggest-department", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.department_id != null) {
          const deptIdStr = String(data.department_id);
          setSelectedDept(deptIdStr);
          const match = departments.find((d) => String(d.id) === deptIdStr);
          setAiSuggestedName(match?.name ?? null);
        } else {
          setAiSuggestedName(null);
        }
      } catch {
        setAiSuggestedName(null);
      }
      setAiSuggesting(false);
    }, 800);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await fetch("/api/complaints/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        department_id: formData.get("department_id") || null,
        priority: formData.get("priority"),
        file_url: uploadedFileUrl,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (data.error) {
      setFormError(data.error);
      return;
    }

    form.reset();
    setUploadedFileUrl(null);
    setSelectedDept("");
    setAiSuggestedName(null);
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
    await load();
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
      const loaded = data.responses ?? [];
      setResponses((prev) => ({ ...prev, [id]: loaded }));
      setResponseCounts((prev) => ({ ...prev, [id]: loaded.length }));
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
      setResponseCounts((prev) => ({
        ...prev,
        [complaintId]: (prev[complaintId] ?? 0) + 1,
      }));
      setReplyText("");
      setReplyFileUrl(null);
    }
    setReplying(false);
  }

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="dash-header">
          <h1>Complaint Portal</h1>
          <p>Submit and track your complaints</p>
        </div>

        <section className="card">
          <h2 className="text-lg font-semibold text-white">Submit a Complaint</h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
              <input name="title" required className="input" placeholder="Brief summary of the issue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                name="description"
                required
                rows={4}
                className="input resize-none"
                placeholder="Describe the issue in detail…"
                onChange={(e) => handleDescriptionChange(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="block text-sm font-medium text-gray-300">Department (optional)</label>
                  {aiSuggesting && (
                    <span className="flex items-center gap-1.5 text-xs text-accent">
                      <span className="h-3 w-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      AI analyzing…
                    </span>
                  )}
                  {!aiSuggesting && aiSuggestedName && (
                    <span className="text-xs text-accent">
                      AI suggested: {aiSuggestedName}
                    </span>
                  )}
                </div>
                <select
                  name="department_id"
                  className="input"
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setAiSuggestedName(null);
                  }}
                >
                  <option value="">General / Not sure</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
                <select name="priority" className="input" defaultValue="medium">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <FileUploadInput
              onFileSelected={(file) => uploadFile(file, setUploadedFileUrl, setUploading)}
              uploading={uploading}
            />
            {uploadedFileUrl && (
              <div className="flex items-center gap-2 text-sm text-accent bg-accent/10 border border-accent/20 rounded-xl px-4 py-2">
                <span>File attached</span>
                <button
                  type="button"
                  onClick={() => setUploadedFileUrl(null)}
                  className="ml-auto text-gray-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            )}

            {formError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                Complaint submitted successfully!
              </div>
            )}
            <button type="submit" disabled={submitting || uploading} className="btn-primary w-full">
              {submitting ? "Submitting…" : "Submit Complaint"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Your Complaints ({complaints.length})
          </h2>
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
                        {c.file_url && <FileAttachment url={c.file_url} />}
                      </div>
                      <div className="flex items-center gap-2">
                        {(responseCounts[c.id] ?? 0) > 0 && (
                          <span className="badge bg-accent/10 text-accent border border-accent/20">
                            {responseCounts[c.id]} {responseCounts[c.id] === 1 ? "reply" : "replies"}
                          </span>
                        )}
                        <span className={statusMap[c.status] ?? "badge"}>
                          {c.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                      {c.department_id && deptMap[c.department_id] && (
                        <span>{deptMap[c.department_id]}</span>
                      )}
                      <span className="capitalize">{c.priority} priority</span>
                      <button
                        onClick={() => toggleExpand(c.id)}
                        className="ml-auto text-accent hover:text-accent-500 font-medium"
                      >
                        {expandedId === c.id ? "Hide responses" : "View responses"}
                      </button>
                    </div>
                  </div>

                  {expandedId === c.id && (
                    <div className="border-t border-border bg-surface-raised/50 p-5 space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300">
                        Responses ({(responses[c.id] ?? []).length})
                      </h4>
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
                        <p className="text-sm text-gray-500">No responses yet. Your complaint is being reviewed.</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Add a comment…"
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
                            {replying ? "…" : "Send"}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer text-xs text-gray-500 hover:text-accent transition-colors">
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadFile(file, setReplyFileUrl, setReplyUploading);
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
              <p className="text-gray-500">You haven&apos;t submitted any complaints yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
