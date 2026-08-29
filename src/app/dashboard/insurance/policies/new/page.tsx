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
          <h1 className="text-xl font-semibold text-slate-800">Add Policy</h1>
          <p className="text-sm text-slate-500">
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
                      href={`/dashboard/insurance/policies/new?patientId=${p.id}`}
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

  const [patient, providers] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.insuranceProvider.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!patient) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-red-600">Patient not found.</p>
        <Link
          href="/dashboard/insurance/policies/new"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Search again
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Add Policy</h1>
        <p className="text-sm text-slate-500">
          For{" "}
          <span className="font-medium text-slate-700">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link
            href="/dashboard/insurance/policies/new"
            className="text-blue-600 hover:underline"
          >
            Change patient
          </Link>
        </p>
      </div>

      {providers.length === 0 ? (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">
          No insurance providers set up yet.{" "}
          <Link
            href="/dashboard/insurance/providers/new"
            className="text-blue-600 hover:underline"
          >
            Add one
          </Link>{" "}
          first.
        </p>
      ) : (
        <form
          action={createPolicy}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <input type="hidden" name="patientId" value={patient.id} />
          <PolicyFormFields providers={providers} />

          <div className="pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Save Policy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
