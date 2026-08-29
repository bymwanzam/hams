import Link from "next/link";
import { listTests, hasLabAccess } from "../actions";
import AccessRestricted from "../AccessRestricted";

export default async function LabCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasLabAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const tests = await listTests(q ?? "");

  const grouped = new Map<string, typeof tests>();
  for (const t of tests) {
    const key = t.category ?? "Uncategorized";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Test Catalog
          </h1>
          <p className="text-sm text-slate-500">
            <Link href="/dashboard/lab" className="text-blue-600 hover:underline">
              ← Laboratory
            </Link>
          </p>
        </div>
        <Link
          href="/dashboard/lab/catalog/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Test
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, code or category"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {tests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-10 text-center text-sm text-slate-400">
          No tests in the catalog yet.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, entries]) => (
          <div
            key={category}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-700">
                {category}
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Test</th>
                  <th className="text-left px-4 py-2">Code</th>
                  <th className="text-left px-4 py-2">Sample</th>
                  <th className="text-left px-4 py-2">Price (GHS)</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {entries.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {t.name}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{t.code}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {t.sampleType ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {t.price.toString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.isAvailable ? "Available" : "Not Available"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/dashboard/lab/catalog/${t.id}/edit`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
