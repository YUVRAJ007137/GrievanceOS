"use server";

import { db } from "@/lib/db";
import { getSessionData } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createDepartment(formData: FormData) {
  const session = await getSessionData();
  if (!session || session.role !== "org_admin") {
    return { error: "Unauthorized." };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { error: "Department name is required." };

  const { error } = await db.from("departments").insert({
    organization_id: session.organizationId,
    name,
    description,
  });

  if (error) return { error: error.message };

  revalidatePath(`/org/${session.orgSlug}/admin/departments`);
  return { success: true };
}

export async function deleteDepartment(id: number) {
  const session = await getSessionData();
  if (!session || session.role !== "org_admin") {
    return { error: "Unauthorized." };
  }

  const { error } = await db
    .from("departments")
    .delete()
    .eq("id", id)
    .eq("organization_id", session.organizationId);

  if (error) return { error: error.message };

  revalidatePath(`/org/${session.orgSlug}/admin/departments`);
  return { success: true };
}
