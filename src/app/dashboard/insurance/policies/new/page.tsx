import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchPatients } from "../../../patients/actions";
import { createPolicy, hasInsuranceAccess } from "../../actions";
import PolicyFormFields from "../PolicyFormFields";
import AccessRestricted from "../../AccessRestricted";

export default async function NewPolicyPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; q?: string }>;
}) {
  if (!(await hasInsuranceAccess())) {
    return <AccessRestricted />;
  }

  const { patientId, q } = await searchParams;

  if (!patientId) {
    const patients = q ? await searchPatients(q) : [];

    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="page-title">Add Policy</h1>
          <p className="text-muted">
            First, find the patient this policy is for.
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
                      href={`/dashboard/insurance/policies/new?patientId=${p.id}`}
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

  const [patient, providers] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.insuranceProvider.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!patient) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="btn btn-ghost">Patient not found.</p>
        <Link
          href="/dashboard/insurance/policies/new"
          className="btn btn-ghost"
        >
          ← Search again
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Add Policy</h1>
        <p className="text-muted">
          For{" "}
          <span className="font-medium text-[color:var(--color-text)]">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link
            href="/dashboard/insurance/policies/new"
            className="btn btn-ghost"
          >
            Change patient
          </Link>
        </p>
      </div>

      {providers.length === 0 ? (
        <p className="text-muted card">
          No insurance providers set up yet.{" "}
          <Link
            href="/dashboard/insurance/providers/new"
            className="btn btn-ghost"
          >
            Add one
          </Link>{" "}
          first.
        </p>
      ) : (
        <form
          action={createPolicy}
          className="card gap-4"
        >
          <input type="hidden" name="patientId" value={patient.id} />
          <PolicyFormFields providers={providers} />

          <div className="pt-2">
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Policy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
