"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "documents");
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Saves the uploaded file to public/uploads/documents and returns the URL
// to store on the Document record.
async function saveDocumentFile(file: File): Promise<string> {
  const extension = ALLOWED_FILE_TYPES[file.type];
  if (!extension) {
    throw new Error("File must be a PDF, JPEG, PNG or WebP");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File must be smaller than 10MB");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/documents/${filename}`;
}

// Best-effort removal of an uploaded file when its Document record is
// deleted. Never throws — a stale file is a minor cleanup issue, not
// something that should block the mutation.
async function deleteDocumentFile(fileUrl: string) {
  if (!fileUrl.startsWith("/uploads/documents/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", fileUrl));
  } catch {
    // File already gone or inaccessible — nothing to do.
  }
}

export async function listDocuments(query: string) {
  return prisma.document.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { patient: { firstName: { contains: query, mode: "insensitive" } } },
            { patient: { lastName: { contains: query, mode: "insensitive" } } },
            { patient: { hospitalNumber: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { patient: true },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function uploadDocument(formData: FormData) {
  const title = (formData.get("title") as string | null)?.trim();
  const patientId = (formData.get("patientId") as string) || undefined;
  const file = formData.get("file");

  if (!title || !(file instanceof File) || file.size === 0) {
    throw new Error("A title and a file are required.");
  }

  const fileUrl = await saveDocumentFile(file);

  await prisma.document.create({
    data: { title, fileUrl, patientId },
  });

  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents");
}

export async function deleteDocument(id: string) {
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) redirect("/dashboard/documents");

  await prisma.document.delete({ where: { id } });
  await deleteDocumentFile(existing.fileUrl);

  revalidatePath("/dashboard/documents");
}
