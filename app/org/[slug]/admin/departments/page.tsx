"use client";

import { useState, useEffect, useCallback } from "react";
import { createDepartment, deleteDepartment } from "./actions";

type Department = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadDepartments = useCallback(async () => {
    const res = await fetch("/api/departments");
    const data = await res.json();
    setDepartments(data.departments ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createDepartment(formData);
    if (result.error) {
      setFormError(result.error);
    } else {
      form.reset();
      setShowForm(false);
      await loadDepartments();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this department? All associated data will be removed.")) return;
    await deleteDepartment(id);
    await loadDepartments();
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
            <h1>Departments</h1>
            <p>{departments.length} department{departments.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? "btn-ghost" : "btn-primary"}>
            {showForm ? "Cancel" : "+ Add Department"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card space-y-4 animate-slide-up">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
              <input name="name" required className="input" placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description (optional)</label>
              <input name="description" className="input" placeholder="Brief description" />
            </div>
            {formError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {formError}
              </div>
            )}
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Creating…" : "Create Department"}
            </button>
          </form>
        )}

        {departments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {departments.map((dept) => (
              <div key={dept.id} className="card-hover flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{dept.name}</h3>
                  {dept.description && (
                    <p className="mt-1 text-sm text-gray-400">{dept.description}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Created {new Date(dept.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">No departments yet. Create your first one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
