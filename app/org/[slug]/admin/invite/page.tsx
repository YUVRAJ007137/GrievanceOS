import { getSessionData } from "@/lib/session";
import { db } from "@/lib/db";

import CopyButton from "./copy-button";

export default async function InvitePage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSessionData();
  if (!session) return null;

  const { data: org } = await db
    .from("organizations")
    .select("name")
    .eq("id", session.organizationId)
    .single();

  const baseUrl = "https://grievance-os.vercel.app";

  const registerUrl = `${baseUrl}/org/${params.slug}/register`;
  const loginUrl = `${baseUrl}/login`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(registerUrl)}&bgcolor=111827&color=3ECF8E&format=svg`;

  return (
    <div className="dash-page">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="dash-header">
          <h1>Invite Users</h1>
          <p>Share registration links for {org?.name ?? params.slug}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* QR Code */}
          <div className="card flex flex-col items-center gap-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Registration QR Code
            </h2>
            <div className="rounded-2xl border border-border bg-surface-raised p-4">
              <img
                src={qrApiUrl}
                alt="Registration QR Code"
                width={280}
                height={280}
                className="rounded-xl"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Scan to open the registration page
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Registration Link
              </h2>
              <p className="text-xs text-gray-500">
                Share this URL with users who need to create an account and submit complaints.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-base px-4 py-2.5 text-sm text-accent font-mono truncate">
                  {registerUrl}
                </div>
                <CopyButton text={registerUrl} />
              </div>
            </div>

            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Login Link
              </h2>
              <p className="text-xs text-gray-500">
                For users who already have an account.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-base px-4 py-2.5 text-sm text-accent font-mono truncate">
                  {loginUrl}
                </div>
                <CopyButton text={loginUrl} />
              </div>
            </div>

            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Organization Slug
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-base px-4 py-2.5 text-sm text-white font-mono">
                  {params.slug}
                </div>
                <CopyButton text={params.slug} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
