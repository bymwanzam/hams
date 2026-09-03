"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";

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

  let facilityId: string;
  if (existing) {
    const updated = await prisma.facility.update({
      where: { id: existing.id },
      data: parsed,
    });
    facilityId = updated.id;
  } else {
    const created = await prisma.facility.create({ data: parsed });
    facilityId = created.id;
  }

  await recordAudit({
    action: existing ? "FACILITY_UPDATED" : "FACILITY_CREATED",
    entity: "Facility",
    entityId: facilityId,
    metadata: { name: parsed.name },
  });

  revalidatePath("/dashboard/facilities");
  revalidatePath("/dashboard");
  redirect("/dashboard/facilities?saved=1");
}
