"use client";

export default function DeleteDocumentButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this document? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-red-500 hover:text-red-700 text-xs font-medium"
      >
        Delete
      </button>
    </form>
  );
}
