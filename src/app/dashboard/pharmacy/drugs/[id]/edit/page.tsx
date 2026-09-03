import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateDrug, hasPharmacyAccess } from "../../../actions";
import DrugFormFields from "../../DrugFormFields";
import AccessRestricted from "../../../AccessRestricted";

export default async function EditDrugPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasPharmacyAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const { error } = await searchParams;
  const drug = await prisma.drug.findUnique({ where: { id } });
  if (!drug) notFound();

  const updateDrugWithId = updateDrug.bind(null, drug.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Edit Drug</h1>
        <p className="text-muted">
          <Link href="/dashboard/pharmacy/drugs" className="btn btn-ghost">
            ← Back to formulary
          </Link>
        </p>
      </div>

      {error && <p className="callout callout-danger">{error}</p>}

      <form action={updateDrugWithId} className="card gap-4">
        <DrugFormFields
          defaults={{
            name: drug.name,
            genericName: drug.genericName,
            form: drug.form,
            unit: drug.unit,
            unitPrice: drug.unitPrice.toString(),
            quantityOnHand: drug.quantityOnHand,
            reorderLevel: drug.reorderLevel,
            nhisCovered: drug.nhisCovered,
            isAvailable: drug.isAvailable,
            batchNumber: drug.batchNumber,
            expiryDate: drug.expiryDate
              ? drug.expiryDate.toISOString().slice(0, 10)
              : null,
          }}
        />

        <div className="pt-2">
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
