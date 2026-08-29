import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClaim,
  submitClaim,
  respondClaim,
  markClaimPaid,
  hasInsuranceAccess,
} from "../actions";
import { claimStatusBadgeClass } from "../labels";
import AccessRestricted from "../AccessRestricted";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await hasInsuranceAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const submitClaimWithId = submitClaim.bind(null, claim.id);
  const respondClaimWithId = respondClaim.bind(null, claim.id);
  const markClaimPaidWithId = markClaimPaid.bind(null, claim.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">
            <Link href="/dashboard/insurance" className="hover:underline">
              ← Insurance &amp; NHIS Claims
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            <Link
              href={`/dashboard/patients/${claim.patient.id}`}
              className="hover:underline"
            >
              {claim.patient.firstName} {claim.patient.lastName}
            </Link>
          </h1>
          <p className="text-sm text-slate-500">{claim.patient.hospitalNumber}</p>
        </div>
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${claimStatusBadgeClass(claim.status)}`}
        >
          {claim.status}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <Info label="Provider" value={claim.provider.name} />
        <Info label="Amount" value={`GHS ${claim.amount.toString()}`} />
        <div>
          <p className="text-xs text-slate-400">Invoice</p>
          {claim.invoice ? (
            <Link
              href={`/dashboard/billing/${claim.invoice.id}`}
              className="text-blue-600 hover:underline"
            >
              #{claim.invoice.id.slice(-8).toUpperCase()}
            </Link>
          ) : (
            <p className="text-slate-700">—</p>
          )}
        </div>
        <Info
          label="Submitted"
          value={
            claim.submittedAt
              ? new Date(claim.submittedAt).toLocaleString()
              : "Not submitted yet"
          }
        />
        {claim.respondedAt && (
          <Info
            label="Responded"
            value={new Date(claim.respondedAt).toLocaleString()}
          />
        )}
        {claim.notes && <Info label="Notes" value={claim.notes} />}
      </div>

      {claim.status === "DRAFT" && (
        <form action={submitClaimWithId}>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Submit Claim
          </button>
        </form>
      )}

      {claim.status === "SUBMITTED" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Record Provider Response
          </h2>
          <form action={respondClaimWithId} className="space-y-3">
            <textarea
              name="notes"
              rows={2}
              placeholder="Notes (e.g. rejection reason)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                name="decision"
                value="APPROVED"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Mark Approved
              </button>
              <button
                type="submit"
                name="decision"
                value="REJECTED"
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Mark Rejected
              </button>
            </div>
          </form>
        </div>
      )}

      {claim.status === "APPROVED" && (
        <form action={markClaimPaidWithId}>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Mark Paid
          </button>
          {claim.invoice && (
            <p className="text-xs text-slate-400 mt-2">
              This will record a GHS {claim.amount.toString()} insurance
              payment against invoice #
              {claim.invoice.id.slice(-8).toUpperCase()}.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  );
}
