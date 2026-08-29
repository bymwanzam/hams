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
          <h1 className="page-title">New Claim</h1>
          <p className="text-muted">
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
                      href={`/dashboard/insurance/new?patientId=${p.id}`}
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
        <Link href="/dashboard/insurance/new" className="btn btn-ghost">
          ← Search again
        </Link>
      </div>
    );
  }

  const { policies, invoices } = await getPatientClaimContext(patient.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">New Claim</h1>
        <p className="text-muted">
          For{" "}
          <span className="font-medium text-[color:var(--color-text)]">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link
            href="/dashboard/insurance/new"
            className="btn btn-ghost"
          >
            Change patient
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      {policies.length === 0 ? (
        <p className="text-muted card">
          This patient has no insurance policy on file.{" "}
          <Link
            href={`/dashboard/insurance/policies/new?patientId=${patient.id}`}
            className="btn btn-ghost"
          >
            Add one
          </Link>{" "}
          first.
        </p>
      ) : (
        <form
          action={createClaim}
          className="card gap-4"
        >
          <input type="hidden" name="patientId" value={patient.id} />

          <div>
            <label className="form-label">
              Insurance Provider
            </label>
            <select
              name="providerId"
              required
              defaultValue=""
              className="input"
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
            <label className="form-label">
              Invoice Being Claimed
            </label>
            <select
              name="invoiceId"
              defaultValue=""
              className="input"
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
            <label className="form-label">
              Claim Amount (GHS)
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              required
              className="input"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Claim (Draft)
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
