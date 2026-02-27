"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getSessionData } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createDeptAdmin(formData: FormData) {
  const session = await getSessionData();
  if (!session || session.role !== "org_admin") {
    return { error: "Unauthorized." };
  }

  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const departmentId = parseInt(formData.get("department_id") as string);

  if (!fullName || !email || !password || !departmentId) {
    return { error: "All fields are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  // Check global email uniqueness
  const { data: e1 } = await db.from("organization_admins").select("id").eq("email", email).single();
  if (e1) return { error: "Email already in use." };
  const { data: e2 } = await db.from("department_admins").select("id").eq("email", email).single();
  if (e2) return { error: "Email already in use." };
  const { data: e3 } = await db.from("users").select("id").eq("email", email).single();
  if (e3) return { error: "Email already in use." };

  const passwordHash = await hashPassword(password);

  const { error } = await db.from("department_admins").insert({
    organization_id: session.organizationId,
    department_id: departmentId,
    email,
    password_hash: passwordHash,
    full_name: fullName,
  });

  if (error) return { error: error.message };

  revalidatePath(`/org/${session.orgSlug}/admin/dept-admins`);
  return { success: true };
}

export async function deleteDeptAdmin(id: number) {
  const session = await getSessionData();
  if (!session || session.role !== "org_admin") {
    return { error: "Unauthorized." };
  }

  const { error } = await db
    .from("department_admins")
    .delete()
    .eq("id", id)
    .eq("organization_id", session.organizationId);

  if (error) return { error: error.message };

  revalidatePath(`/org/${session.orgSlug}/admin/dept-admins`);
  return { success: true };
}
