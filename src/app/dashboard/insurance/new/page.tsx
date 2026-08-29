import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchPatients } from "../../patients/actions";
import { createClaim, getPatientClaimContext, hasInsuranceAccess } from "../actions";
import AccessRestricted from "../AccessRestricted";

export default async function NewClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; q?: string; error?: string }>;
}) {
  if (!(await hasInsuranceAccess())) {
    return <AccessRestricted />;
  }

  const { patientId, q, error } = await searchParams;

  if (!patientId) {
    const patients = q ? await searchPatients(q) : [];

    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">New Claim</h1>
          <p className="text-sm text-slate-500">
            First, find the patient this claim is for.
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
                      href={`/dashboard/insurance/new?patientId=${p.id}`}
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
        <Link href="/dashboard/insurance/new" className="text-sm text-blue-600 hover:underline">
          ← Search again
        </Link>
      </div>
    );
  }

  const { policies, invoices } = await getPatientClaimContext(patient.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">New Claim</h1>
        <p className="text-sm text-slate-500">
          For{" "}
          <span className="font-medium text-slate-700">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link
            href="/dashboard/insurance/new"
            className="text-blue-600 hover:underline"
          >
            Change patient
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {policies.length === 0 ? (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">
          This patient has no insurance policy on file.{" "}
          <Link
            href={`/dashboard/insurance/policies/new?patientId=${patient.id}`}
            className="text-blue-600 hover:underline"
          >
            Add one
          </Link>{" "}
          first.
        </p>
      ) : (
        <form
          action={createClaim}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <input type="hidden" name="patientId" value={patient.id} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Insurance Provider
            </label>
            <select
              name="providerId"
              required
              defaultValue=""
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select provider…
              </option>
              {policies.map((p) => (
                <option key={p.id} value={p.providerId}>
                  {p.provider.name} — {p.policyNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Invoice Being Claimed
            </label>
            <select
              name="invoiceId"
              defaultValue=""
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— None / not yet billed —</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  #{inv.id.slice(-8).toUpperCase()} — GHS{" "}
                  {inv.totalAmount.toString()} ({inv.status.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Claim Amount (GHS)
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Save Claim (Draft)
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
