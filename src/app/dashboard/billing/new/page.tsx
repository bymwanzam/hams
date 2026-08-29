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
          <h1 className="text-xl font-semibold text-slate-800">New Invoice</h1>
          <p className="text-sm text-slate-500">
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        {q && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {patients.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No patients found.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/billing/new?patientId=${p.id}`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
                    >
                      <span>
                        {p.firstName} {p.lastName}
                        <span className="text-slate-400">
                          {" "}
                          · {p.hospitalNumber}
                        </span>
                      </span>
                      <span className="text-slate-400">{p.phone ?? ""}</span>
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
        <p className="text-sm text-red-600">Patient not found.</p>
        <Link href="/dashboard/billing/new" className="text-sm text-blue-600 hover:underline">
          ← Search again
        </Link>
      </div>
    );
  }

  const { labOrders, dispenseItems } = await getUnbilledCharges(patient.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">New Invoice</h1>
        <p className="text-sm text-slate-500">
          For{" "}
          <span className="font-medium text-slate-700">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link href="/dashboard/billing/new" className="text-blue-600 hover:underline">
            Change patient
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={createInvoice}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
      >
        <input type="hidden" name="patientId" value={patient.id} />

        {(labOrders.length > 0 || dispenseItems.length > 0) && (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              Unbilled Charges
            </h2>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {labOrders.map((o) => (
                <label
                  key={o.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="labOrderId"
                      value={o.id}
                      defaultChecked
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Lab: {o.test.name}
                  </span>
                  <span className="text-slate-500">
                    GHS {o.test.price.toString()}
                  </span>
                </label>
              ))}
              {dispenseItems.map((di) => (
                <label
                  key={di.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="dispenseItemId"
                      value={di.id}
                      defaultChecked
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Drug: {di.drug.name} ×{di.quantity}
                  </span>
                  <span className="text-slate-500">
                    GHS {(Number(di.drug.unitPrice) * di.quantity).toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Other Charges
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Consultation fees, ward charges, procedures — anything not
            already priced in the system.
          </p>
          <ManualLineItems />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
