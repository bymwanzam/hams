import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateFacility } from "../../actions";
import FacilityFormFields from "../../FacilityFormFields";

export default async function EditFacilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const facility = await prisma.facility.findUnique({ where: { id } });
  if (!facility) notFound();

  const updateFacilityWithId = updateFacility.bind(null, facility.id);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Edit {facility.name}
        </h1>
        <p className="text-sm text-slate-500">
          <Link
            href="/dashboard/facilities"
            className="text-blue-600 hover:underline"
          >
            ← Back to Hospital Setup
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={updateFacilityWithId}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <FacilityFormFields
          defaults={{
            name: facility.name,
            code: facility.code,
            address: facility.address,
            phone: facility.phone,
            isMain: facility.isMain,
          }}
        />

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Changes
          </button>
          <Link
            href="/dashboard/facilities"
            className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
