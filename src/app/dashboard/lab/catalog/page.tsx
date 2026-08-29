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
          <h1 className="page-title">
            Test Catalog
          </h1>
          <p className="text-muted">
            <Link href="/dashboard/lab" className="btn btn-ghost">
              ← Laboratory
            </Link>
          </p>
        </div>
        <Link
          href="/dashboard/lab/catalog/new"
          className="btn btn-primary"
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
          className="input"
        />
      </form>

      {tests.length === 0 ? (
        <div className="panel px-4 py-10 text-center text-sm text-muted">
          No tests in the catalog yet.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, entries]) => (
          <div
            key={category}
            className="panel"
          >
            <div className="panel-head">
              <h2 className="card-title">
                {category}
              </h2>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Code</th>
                  <th>Sample</th>
                  <th>Price (GHS)</th>
                  <th>Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {entries.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 font-[600]">
                      {t.name}
                    </td>
                    <td className="px-4 py-2 text-muted">{t.code}</td>
                    <td className="px-4 py-2 text-muted">
                      {t.sampleType ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {t.price.toString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`${
                          t.isAvailable
                            ? "tag tag-success"
                            : "tag tag-danger"
                        }`}
                      >
                        {t.isAvailable ? "Available" : "Not Available"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/dashboard/lab/catalog/${t.id}/edit`}
                        className="btn btn-ghost"
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
