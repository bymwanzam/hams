"use client";

export default function CancelOrderButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Remove this order? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-red-500 hover:text-red-700 text-xs font-medium"
      >
        Remove
      </button>
    </form>
  );
}
