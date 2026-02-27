"use client";

import { useState, useEffect, useCallback } from "react";
import { createDeptAdmin, deleteDeptAdmin } from "./actions";

type DeptAdmin = {
  id: number;
  email: string;
  full_name: string;
  department_id: number;
  created_at: string;
};

type Department = {
  id: number;
  name: string;
};

export default function DeptAdminsPage() {
  const [admins, setAdmins] = useState<DeptAdmin[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [adminsRes, deptsRes] = await Promise.all([
      fetch("/api/dept-admins"),
      fetch("/api/departments"),
    ]);
    const adminsData = await adminsRes.json();
    const deptsData = await deptsRes.json();
    setAdmins(adminsData.deptAdmins ?? []);
    setDepartments(deptsData.departments ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createDeptAdmin(formData);
    if (result.error) {
      setFormError(result.error);
    } else {
      form.reset();
      setShowForm(false);
      await load();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this department admin account?")) return;
    await deleteDeptAdmin(id);
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="dash-header">
            <h1>Department Admins</h1>
            <p>{admins.length} account{admins.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? "btn-ghost" : "btn-primary"}>
            {showForm ? "Cancel" : "+ Add Dept Admin"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card space-y-4 animate-slide-up">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full name</label>
                <input name="full_name" required className="input" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input name="email" type="email" required className="input" placeholder="admin@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input name="password" type="password" required minLength={6} className="input" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
                <select name="department_id" required className="input">
                  <option value="">Select department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {formError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {formError}
              </div>
            )}
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Creating…" : "Create Dept Admin"}
            </button>
          </form>
        )}

        {admins.length > 0 ? (
          <div className="card !p-0 overflow-hidden">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium text-white">{a.full_name}</td>
                    <td className="text-gray-400">{a.email}</td>
                    <td className="text-gray-400">{deptMap[a.department_id] ?? "Unknown"}</td>
                    <td className="text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDelete(a.id)} className="text-sm text-gray-500 hover:text-red-400 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">No department admin accounts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
