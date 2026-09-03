import Link from "next/link";
import { searchPatients } from "../patients/actions";

export default async function IdCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const patients = await searchPatients(q ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          ID Card Printing
        </h1>
        <p className="text-muted">
          Find a patient to print their hospital ID card.
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

      <div className="panel">
        {patients.length === 0 ? (
          <p className="px-4 py-8 text-center text-muted">
            {q ? "No patients found." : "Search for a patient above."}
          </p>
        ) : (
          <ul className="list">
            {patients.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/id-cards/${p.id}`}
                  className="row-link"
                >
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photoUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[var(--color-neutral-200)] flex items-center justify-center text-muted text-xs font-medium">
                      {p.firstName[0]}
                      {p.lastName[0]}
                    </div>
                  )}
                  <span className="flex-1">
                    {p.firstName} {p.lastName}
                    <span className="text-muted">
                      {" "}
                      · {p.hospitalNumber}
                    </span>
                  </span>
                  <span className="text-[color:var(--color-accent)]">Print →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
