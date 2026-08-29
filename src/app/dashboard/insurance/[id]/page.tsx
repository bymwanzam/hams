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
          <p className="eyebrow">
            <Link href="/dashboard/insurance" className="hover:underline">
              ← Insurance &amp; NHIS Claims
            </Link>
          </p>
          <h1 className="page-title">
            <Link
              href={`/dashboard/patients/${claim.patient.id}`}
              className="hover:underline"
            >
              {claim.patient.firstName} {claim.patient.lastName}
            </Link>
          </h1>
          <p className="text-muted">{claim.patient.hospitalNumber}</p>
        </div>
        <span
          className={`${claimStatusBadgeClass(claim.status)}`}
        >
          {claim.status}
        </span>
      </div>

      <div className="card grid grid-cols-2 gap-4">
        <Info label="Provider" value={claim.provider.name} />
        <Info label="Amount" value={`GHS ${claim.amount.toString()}`} />
        <div>
          <p className="eyebrow">Invoice</p>
          {claim.invoice ? (
            <Link
              href={`/dashboard/billing/${claim.invoice.id}`}
              className="btn btn-ghost"
            >
              #{claim.invoice.id.slice(-8).toUpperCase()}
            </Link>
          ) : (
            <p className="text-[color:var(--color-text)]">—</p>
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
            className="btn btn-primary"
          >
            Submit Claim
          </button>
        </form>
      )}

      {claim.status === "SUBMITTED" && (
        <div className="card gap-3">
          <h2 className="card-title">
            Record Provider Response
          </h2>
          <form action={respondClaimWithId} className="space-y-3">
            <textarea
              name="notes"
              rows={2}
              placeholder="Notes (e.g. rejection reason)"
              className="input"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                name="decision"
                value="APPROVED"
                className="btn btn-primary"
              >
                Mark Approved
              </button>
              <button
                type="submit"
                name="decision"
                value="REJECTED"
                className="btn btn-primary"
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
            className="btn btn-secondary"
          >
            Mark Paid
          </button>
          {claim.invoice && (
            <p className="eyebrow mt-2">
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
      <p className="eyebrow">{label}</p>
      <p className="text-[color:var(--color-text)]">{value}</p>
    </div>
  );
}
