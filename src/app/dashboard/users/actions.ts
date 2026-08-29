"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { roleHasModuleAccess } from "@/lib/access";
import { USER_ROLES } from "./labels";

export async function hasUsersAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "users");
}

async function requireUsersAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "users")) {
    throw new Error("Only administrators can manage users.");
  }
}

export async function listUsers(query: string) {
  return prisma.user.findMany({
    where: query
      ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { facility: true },
    orderBy: { createdAt: "desc" },
  });
}

const RoleEnum = z.enum(USER_ROLES);

const CreateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: RoleEnum,
  facilityId: z.string().optional(),
  isActive: z.coerce.boolean(),
});

function emailConflictMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "A user with that email already exists.";
  }
  return null;
}

export async function createUser(formData: FormData) {
  await requireUsersAccess();

  const parsed = CreateUserSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    facilityId: formData.get("facilityId") || undefined,
    isActive: formData.get("isActive") === "on",
  });

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  try {
    await prisma.user.create({
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        passwordHash,
        role: parsed.role,
        facilityId: parsed.facilityId || undefined,
        isActive: parsed.isActive,
      },
    });
  } catch (error) {
    const message = emailConflictMessage(error);
    if (message) {
      redirect(`/dashboard/users/new?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}

const UpdateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  role: RoleEnum,
  facilityId: z.string().optional(),
  isActive: z.coerce.boolean(),
});

export async function updateUser(id: string, formData: FormData) {
  await requireUsersAccess();

  const parsed = UpdateUserSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
    facilityId: formData.get("facilityId") || undefined,
    isActive: formData.get("isActive") === "on",
  });

  const data: Prisma.UserUpdateInput = {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.email,
    role: parsed.role,
    facility: parsed.facilityId
      ? { connect: { id: parsed.facilityId } }
      : { disconnect: true },
    isActive: parsed.isActive,
  };

  if (parsed.password) {
    data.passwordHash = await bcrypt.hash(parsed.password, 10);
  }

  try {
    await prisma.user.update({ where: { id }, data });
  } catch (error) {
    const message = emailConflictMessage(error);
    if (message) {
      redirect(
        `/dashboard/users/${id}/edit?error=${encodeURIComponent(message)}`
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}
