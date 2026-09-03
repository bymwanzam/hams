"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { roleHasModuleAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
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
            { username: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
}

const RoleEnum = z.enum(USER_ROLES);

// Empty string from an untouched optional field means "no username".
const UsernameField = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(50)
  .optional()
  .or(z.literal(""));

const CreateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  username: UsernameField,
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: RoleEnum,
  isActive: z.coerce.boolean(),
});

function uniqueConflictMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = (error.meta?.target as string[] | undefined) ?? [];
    if (target.includes("username")) {
      return "A user with that username already exists.";
    }
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
    username: formData.get("username") ?? undefined,
    password: formData.get("password"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
  });

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  let createdId: string;
  try {
    const created = await prisma.user.create({
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        username: parsed.username || null,
        passwordHash,
        role: parsed.role,
        isActive: parsed.isActive,
      },
    });
    createdId = created.id;
  } catch (error) {
    const message = uniqueConflictMessage(error);
    if (message) {
      redirect(`/dashboard/users/new?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  await recordAudit({
    action: "USER_CREATED",
    entity: "User",
    entityId: createdId,
    metadata: {
      email: parsed.email,
      role: parsed.role,
      isActive: parsed.isActive,
    },
  });

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}

const UpdateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  username: UsernameField,
  password: z.string().min(8).optional().or(z.literal("")),
  role: RoleEnum,
  isActive: z.coerce.boolean(),
});

export async function updateUser(id: string, formData: FormData) {
  await requireUsersAccess();

  const before = await prisma.user.findUnique({
    where: { id },
    select: { role: true, isActive: true },
  });

  const parsed = UpdateUserSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    username: formData.get("username") ?? undefined,
    password: formData.get("password") || undefined,
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
  });

  const data: Prisma.UserUpdateInput = {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.email,
    username: parsed.username || null,
    role: parsed.role,
    isActive: parsed.isActive,
  };

  if (parsed.password) {
    data.passwordHash = await bcrypt.hash(parsed.password, 10);
  }

  try {
    await prisma.user.update({ where: { id }, data });
  } catch (error) {
    const message = uniqueConflictMessage(error);
    if (message) {
      redirect(
        `/dashboard/users/${id}/edit?error=${encodeURIComponent(message)}`
      );
    }
    throw error;
  }

  await recordAudit({
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    metadata: {
      email: parsed.email,
      role: parsed.role,
      roleChanged: !!before && before.role !== parsed.role,
      deactivated: !!before && before.isActive && !parsed.isActive,
      reactivated: !!before && !before.isActive && parsed.isActive,
      passwordReset: Boolean(parsed.password),
    },
  });

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}
