"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const slug = (formData.get("slug") as string)?.trim();
  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!fullName || !email || !password) {
    return { error: "All fields are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const { data: org } = await db
    .from("organizations")
    .select("id, slug")
    .eq("slug", slug)
    .single();

  if (!org) {
    return { error: "Organization not found." };
  }

  // Check if email already exists across all tables
  const { data: existingOrgAdmin } = await db
    .from("organization_admins")
    .select("id")
    .eq("email", email)
    .single();
  if (existingOrgAdmin) return { error: "An account with this email already exists." };

  const { data: existingDeptAdmin } = await db
    .from("department_admins")
    .select("id")
    .eq("email", email)
    .single();
  if (existingDeptAdmin) return { error: "An account with this email already exists." };

  const { data: existingUser } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  if (existingUser) return { error: "An account with this email already exists." };

  const passwordHash = await hashPassword(password);

  const { data: user, error: insertError } = await db
    .from("users")
    .insert({
      organization_id: org.id,
      email,
      password_hash: passwordHash,
      full_name: fullName,
    })
    .select("id, email, full_name, organization_id")
    .single();

  if (insertError || !user) {
    return { error: insertError?.message ?? "Failed to create account." };
  }

  const session = await getSession();
  session.id = user.id;
  session.email = user.email;
  session.fullName = user.full_name;
  session.role = "user";
  session.organizationId = user.organization_id;
  session.orgSlug = org.slug;
  await session.save();

  redirect(`/org/${org.slug}`);
}
