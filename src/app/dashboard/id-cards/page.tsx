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
        <h1 className="text-xl font-semibold text-slate-800">
          ID Card Printing
        </h1>
        <p className="text-sm text-slate-500">
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {patients.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            {q ? "No patients found." : "Search for a patient above."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {patients.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/id-cards/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photoUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-medium">
                      {p.firstName[0]}
                      {p.lastName[0]}
                    </div>
                  )}
                  <span className="flex-1">
                    {p.firstName} {p.lastName}
                    <span className="text-slate-400">
                      {" "}
                      · {p.hospitalNumber}
                    </span>
                  </span>
                  <span className="text-blue-600">Print →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
