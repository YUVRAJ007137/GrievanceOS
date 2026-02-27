import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  id: number;
  email: string;
  fullName: string;
  role: "org_admin" | "dept_admin" | "user";
  organizationId: number;
  orgSlug: string;
  departmentId?: number;
};

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "grievanceos-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getSessionData(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.id) return null;
  return {
    id: session.id,
    email: session.email,
    fullName: session.fullName,
    role: session.role,
    organizationId: session.organizationId,
    orgSlug: session.orgSlug,
    departmentId: session.departmentId,
  };
}
