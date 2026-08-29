import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateUnit, hasBloodBankAccess } from "../../actions";
import UnitFormFields from "../../UnitFormFields";
import AccessRestricted from "../../AccessRestricted";

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await hasBloodBankAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const unit = await prisma.bloodBankUnit.findUnique({ where: { id } });
  if (!unit) notFound();

  const updateUnitWithId = updateUnit.bind(null, unit.id);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Edit {unit.bloodGroup} Unit
        </h1>
        <p className="text-sm text-slate-500">
          <Link
            href={`/dashboard/blood-bank/${unit.id}`}
            className="text-blue-600 hover:underline"
          >
            ← Back to unit
          </Link>
        </p>
      </div>

      <form
        action={updateUnitWithId}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <UnitFormFields
          defaults={{
            bloodGroup: unit.bloodGroup,
            volumeMl: unit.volumeMl,
            collectedAt: unit.collectedAt,
            expiresAt: unit.expiresAt,
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
            href={`/dashboard/blood-bank/${unit.id}`}
            className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
