"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const FacilitySchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
});

// This system runs for a single hospital, so Hospital Setup is one
// registration form: create the profile the first time, edit it in place
// afterwards. There is never more than one Facility row.
export async function saveFacility(formData: FormData) {
  const parsed = FacilitySchema.parse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
  });

  const existing = await prisma.facility.findFirst();

  if (existing) {
    await prisma.facility.update({ where: { id: existing.id }, data: parsed });
  } else {
    await prisma.facility.create({ data: parsed });
  }

  revalidatePath("/dashboard/facilities");
  revalidatePath("/dashboard");
  redirect("/dashboard/facilities?saved=1");
}
