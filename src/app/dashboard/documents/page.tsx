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
          <h1 className="page-title">Documents</h1>
          <p className="text-muted">
            Patient and administrative document storage.
          </p>
        </div>
        <Link
          href="/dashboard/documents/new"
          className="btn btn-primary"
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
          className="input"
        />
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Patient</th>
              <th>Uploaded</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
            {documents.map((doc) => {
              const deleteDocumentWithId = deleteDocument.bind(null, doc.id);
              return (
                <tr key={doc.id}>
                  <td className="px-4 py-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost font-medium"
                    >
                      {doc.title}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {doc.patient ? (
                      <Link
                        href={`/dashboard/patients/${doc.patient.id}`}
                        className="hover:underline"
                      >
                        {doc.patient.firstName} {doc.patient.lastName}
                        <span className="text-muted">
                          {" "}
                          · {doc.patient.hospitalNumber}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-muted">— Administrative —</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted">
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
