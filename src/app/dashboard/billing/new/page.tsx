import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchPatients } from "../../patients/actions";
import { createInvoice, getUnbilledCharges, hasBillingAccess } from "../actions";
import ManualLineItems from "../ManualLineItems";
import AccessRestricted from "../AccessRestricted";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; q?: string; error?: string }>;
}) {
  if (!(await hasBillingAccess())) {
    return <AccessRestricted />;
  }

  const { patientId, q, error } = await searchParams;

  if (!patientId) {
    const patients = q ? await searchPatients(q) : [];

    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="page-title">New Invoice</h1>
          <p className="text-muted">
            First, find the patient this invoice is for.
          </p>
        </div>

        <form className="max-w-sm">
          <input
            type="text"
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Search by name, hospital no. or phone"
            className="input"
          />
        </form>

        {q && (
          <div className="panel">
            {patients.length === 0 ? (
              <p className="px-4 py-8 text-center text-muted">
                No patients found.
              </p>
            ) : (
              <ul className="list">
                {patients.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/billing/new?patientId=${p.id}`}
                      className="row-link"
                    >
                      <span>
                        {p.firstName} {p.lastName}
                        <span className="text-muted">
                          {" "}
                          · {p.hospitalNumber}
                        </span>
                      </span>
                      <span className="text-muted">{p.phone ?? ""}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });

  if (!patient) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="btn btn-ghost">Patient not found.</p>
        <Link href="/dashboard/billing/new" className="btn btn-ghost">
          ← Search again
        </Link>
      </div>
    );
  }

  const { labOrders, dispenseItems } = await getUnbilledCharges(patient.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">New Invoice</h1>
        <p className="text-muted">
          For{" "}
          <span className="font-medium text-[color:var(--color-text)]">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link href="/dashboard/billing/new" className="btn btn-ghost">
            Change patient
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <form
        action={createInvoice}
        className="card space-y-6"
      >
        <input type="hidden" name="patientId" value={patient.id} />

        {(labOrders.length > 0 || dispenseItems.length > 0) && (
          <div>
            <h2 className="card-title mb-2">
              Unbilled Charges
            </h2>
            <div className="panel list">
              {labOrders.map((o) => (
                <label
                  key={o.id}
                  className="row-link cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="labOrderId"
                      value={o.id}
                      defaultChecked
                      className="check"
                    />
                    Lab: {o.test.name}
                  </span>
                  <span className="text-muted">
                    GHS {o.test.price.toString()}
                  </span>
                </label>
              ))}
              {dispenseItems.map((di) => (
                <label
                  key={di.id}
                  className="row-link cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="dispenseItemId"
                      value={di.id}
                      defaultChecked
                      className="check"
                    />
                    Drug: {di.drug.name} ×{di.quantity}
                  </span>
                  <span className="text-muted">
                    GHS {(Number(di.drug.unitPrice) * di.quantity).toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="card-title mb-2">
            Other Charges
          </h2>
          <p className="eyebrow mb-3">
            Consultation fees, ward charges, procedures — anything not
            already priced in the system.
          </p>
          <ManualLineItems />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
