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
        <h1 className="page-title">
          Edit {unit.bloodGroup} Unit
        </h1>
        <p className="text-muted">
          <Link
            href={`/dashboard/blood-bank/${unit.id}`}
            className="btn btn-ghost"
          >
            ← Back to unit
          </Link>
        </p>
      </div>

      <form
        action={updateUnitWithId}
        className="card gap-4"
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
            className="btn btn-primary"
          >
            Save Changes
          </button>
          <Link
            href={`/dashboard/blood-bank/${unit.id}`}
            className="btn btn-ghost"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
