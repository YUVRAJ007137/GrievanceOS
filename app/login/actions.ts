"use server";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // Check organization_admins
  const { data: orgAdmin } = await db
    .from("organization_admins")
    .select("id, email, password_hash, full_name, organization_id")
    .eq("email", email)
    .single();

  if (orgAdmin) {
    const valid = await verifyPassword(password, orgAdmin.password_hash);
    if (!valid) return { error: "Invalid email or password." };

    const { data: org } = await db
      .from("organizations")
      .select("slug")
      .eq("id", orgAdmin.organization_id)
      .single();

    const session = await getSession();
    session.id = orgAdmin.id;
    session.email = orgAdmin.email;
    session.fullName = orgAdmin.full_name;
    session.role = "org_admin";
    session.organizationId = orgAdmin.organization_id;
    session.orgSlug = org?.slug ?? "";
    await session.save();

    redirect(`/org/${org?.slug}/admin`);
  }

  // Check department_admins
  const { data: deptAdmin } = await db
    .from("department_admins")
    .select("id, email, password_hash, full_name, organization_id, department_id")
    .eq("email", email)
    .single();

  if (deptAdmin) {
    const valid = await verifyPassword(password, deptAdmin.password_hash);
    if (!valid) return { error: "Invalid email or password." };

    const { data: org } = await db
      .from("organizations")
      .select("slug")
      .eq("id", deptAdmin.organization_id)
      .single();

    const session = await getSession();
    session.id = deptAdmin.id;
    session.email = deptAdmin.email;
    session.fullName = deptAdmin.full_name;
    session.role = "dept_admin";
    session.organizationId = deptAdmin.organization_id;
    session.orgSlug = org?.slug ?? "";
    session.departmentId = deptAdmin.department_id;
    await session.save();

    redirect(`/org/${org?.slug}/dept/${deptAdmin.department_id}`);
  }

  // Check users
  const { data: user } = await db
    .from("users")
    .select("id, email, password_hash, full_name, organization_id")
    .eq("email", email)
    .single();

  if (user) {
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return { error: "Invalid email or password." };

    const { data: org } = await db
      .from("organizations")
      .select("slug")
      .eq("id", user.organization_id)
      .single();

    const session = await getSession();
    session.id = user.id;
    session.email = user.email;
    session.fullName = user.full_name;
    session.role = "user";
    session.organizationId = user.organization_id;
    session.orgSlug = org?.slug ?? "";
    await session.save();

    redirect(`/org/${org?.slug}`);
  }

  return { error: "Invalid email or password." };
}
