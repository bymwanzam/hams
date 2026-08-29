"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { roleHasModuleAccess } from "@/lib/access";

export async function hasHrAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "hr");
}

async function requireHrAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "hr")) {
    throw new Error("HR access is restricted to HR/admin staff.");
  }
}

export async function listEmployees(query: string) {
  return prisma.employee.findMany({
    where: query
      ? {
          OR: [
            { staffNumber: { contains: query, mode: "insensitive" } },
            { department: { contains: query, mode: "insensitive" } },
            { position: { contains: query, mode: "insensitive" } },
            {
              user: { firstName: { contains: query, mode: "insensitive" } },
            },
            { user: { lastName: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { user: true },
    orderBy: [{ department: "asc" }, { user: { lastName: "asc" } }],
  });
}

export async function getEmployee(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      user: true,
      attendance: { orderBy: { clockIn: "desc" } },
    },
  });
}

// Login accounts that don't yet have a staff record — the only ones eligible
// to be turned into an Employee, since Employee.userId is a 1:1 link and
// account creation itself stays the Users module's job.
export async function listUnlinkedUsers() {
  return prisma.user.findMany({
    where: { employee: null },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

const EmployeeSchema = z.object({
  staffNumber: z.string().min(1),
  department: z.string().min(1),
  position: z.string().min(1),
  salary: z.coerce.number().min(0),
  hireDate: z.string().min(1),
});

function conflictMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "That staff number or user account is already linked to a staff record.";
  }
  return null;
}

export async function createEmployee(formData: FormData) {
  await requireHrAccess();
  const userId = formData.get("userId") as string;
  if (!userId) {
    redirect(
      `/dashboard/hr/new?error=${encodeURIComponent("Select a user account to link.")}`
    );
  }

  const parsed = EmployeeSchema.parse({
    staffNumber: formData.get("staffNumber"),
    department: formData.get("department"),
    position: formData.get("position"),
    salary: formData.get("salary"),
    hireDate: formData.get("hireDate"),
  });

  try {
    await prisma.employee.create({
      data: {
        userId,
        staffNumber: parsed.staffNumber,
        department: parsed.department,
        position: parsed.position,
        salary: parsed.salary,
        hireDate: new Date(parsed.hireDate),
      },
    });
  } catch (error) {
    const message = conflictMessage(error);
    if (message) {
      redirect(`/dashboard/hr/new?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/hr");
  redirect("/dashboard/hr");
}

export async function updateEmployee(id: string, formData: FormData) {
  await requireHrAccess();
  const parsed = EmployeeSchema.parse({
    staffNumber: formData.get("staffNumber"),
    department: formData.get("department"),
    position: formData.get("position"),
    salary: formData.get("salary"),
    hireDate: formData.get("hireDate"),
  });

  try {
    await prisma.employee.update({
      where: { id },
      data: {
        staffNumber: parsed.staffNumber,
        department: parsed.department,
        position: parsed.position,
        salary: parsed.salary,
        hireDate: new Date(parsed.hireDate),
      },
    });
  } catch (error) {
    const message = conflictMessage(error);
    if (message) {
      redirect(
        `/dashboard/hr/${id}/edit?error=${encodeURIComponent(message)}`
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/hr");
  revalidatePath(`/dashboard/hr/${id}`);
  redirect(`/dashboard/hr/${id}`);
}

// Biometric-style single clock: whichever of in/out is next is the one the
// detail page's button submits — there's at most one open (no clockOut)
// record per employee at a time.
export async function clockIn(employeeId: string) {
  await requireHrAccess();
  const open = await prisma.attendanceRecord.findFirst({
    where: { employeeId, clockOut: null },
  });
  if (!open) {
    await prisma.attendanceRecord.create({
      data: { employeeId, clockIn: new Date() },
    });
  }
  revalidatePath(`/dashboard/hr/${employeeId}`);
}

export async function clockOut(employeeId: string) {
  await requireHrAccess();
  const open = await prisma.attendanceRecord.findFirst({
    where: { employeeId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (open) {
    await prisma.attendanceRecord.update({
      where: { id: open.id },
      data: { clockOut: new Date() },
    });
  }
  revalidatePath(`/dashboard/hr/${employeeId}`);
}
