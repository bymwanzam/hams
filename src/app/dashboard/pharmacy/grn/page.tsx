import Link from "next/link";
import { listDrugs, receiveDrugStock, hasPharmacyAccess } from "../actions";
import AccessRestricted from "../AccessRestricted";

export default async function GrnPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasPharmacyAccess())) {
    return <AccessRestricted />;
  }

  const { error } = await searchParams;
  const drugs = await listDrugs("");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="eyebrow">
          <Link href="/dashboard/pharmacy" className="hover:underline">
            ← Pharmacy &amp; Inventory
          </Link>
        </p>
        <h1 className="page-title">Add Stock (GRN)</h1>
        <p className="text-muted">
          Record a goods-received note — the batch and expiry entered here
          become the drug&apos;s current stock lot.
        </p>
      </div>

      {error && <p className="callout callout-danger">{error}</p>}

      <form action={receiveDrugStock} className="card gap-4">
        <div>
          <label className="form-label">Drug</label>
          <select name="drugId" required defaultValue="" className="input">
            <option value="" disabled>
              Select a drug…
            </option>
            {drugs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.form ? ` · ${d.form}` : ""} (on hand: {d.quantityOnHand})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Quantity Received</label>
            <input
              type="number"
              name="quantity"
              min="1"
              required
              className="input"
            />
          </div>
          <div>
            <label className="form-label">Batch No.</label>
            <input name="batchNumber" placeholder="e.g. B-5512" className="input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Expiry Date</label>
            <input type="date" name="expiryDate" className="input" />
          </div>
          <div>
            <label className="form-label">Reference</label>
            <input
              name="reference"
              placeholder="Supplier, invoice no."
              className="input"
            />
          </div>
        </div>

        <div>
          <button type="submit" className="btn btn-primary">
            Receive Stock
          </button>
        </div>
      </form>
    </div>
  );
}
