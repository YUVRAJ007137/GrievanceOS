"use client";

import Link from "next/link";
import { useState } from "react";
import { setupOrganization } from "./actions";

export default function SetupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await setupOrganization(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 bg-base-50/80 backdrop-blur-xl border-b border-border">
        <Link href="/" className="text-xl font-bold tracking-tight text-accent">
          GrievanceOS
        </Link>
        <Link href="/login" className="btn-ghost">
          Log in
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <div className="card">
            <h1 className="text-2xl font-bold text-white">Set up your organization</h1>
            <p className="mt-1.5 text-sm text-gray-400">
              Create an organization and your admin account in one step.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Organization name
                </label>
                <input name="org_name" required className="input" placeholder="Acme Inc." />
              </div>

              <hr className="border-border" />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Your full name
                </label>
                <input name="full_name" required className="input" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <input name="email" type="email" required className="input" placeholder="admin@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <input name="password" type="password" required minLength={6} className="input" placeholder="Min 6 characters" />
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Setting up…" : "Create Organization"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
