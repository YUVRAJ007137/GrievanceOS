"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { registerUser } from "./actions";

export default function OrgRegisterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("slug", slug);
    const result = await registerUser(formData);
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
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
        <div className="w-full max-w-sm relative z-10">
          <div className="card">
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="mt-1.5 text-sm text-gray-400">
              Register to submit complaints for{" "}
              <span className="font-medium text-accent">{slug}</span>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  className="input"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-accent hover:text-accent-500">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
