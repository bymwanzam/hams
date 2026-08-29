import Link from "next/link";
import { listDocuments, deleteDocument } from "./actions";
import DeleteDocumentButton from "./DeleteDocumentButton";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const documents = await listDocuments(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Documents</h1>
          <p className="text-sm text-slate-500">
            Patient and administrative document storage.
          </p>
        </div>
        <Link
          href="/dashboard/documents/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Document
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by title or patient"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Title</th>
              <th className="text-left px-4 py-2">Patient</th>
              <th className="text-left px-4 py-2">Uploaded</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
            {documents.map((doc) => {
              const deleteDocumentWithId = deleteDocument.bind(null, doc.id);
              return (
                <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {doc.title}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {doc.patient ? (
                      <Link
                        href={`/dashboard/patients/${doc.patient.id}`}
                        className="hover:underline"
                      >
                        {doc.patient.firstName} {doc.patient.lastName}
                        <span className="text-slate-400">
                          {" "}
                          · {doc.patient.hospitalNumber}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-slate-400">— Administrative —</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(doc.uploadedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <DeleteDocumentButton action={deleteDocumentWithId} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
