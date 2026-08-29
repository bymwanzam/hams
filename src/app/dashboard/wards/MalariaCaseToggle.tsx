"use client";

export default function MalariaCaseToggle({
  action,
  defaultChecked,
}: {
  action: (formData: FormData) => void;
  defaultChecked: boolean;
}) {
  return (
    <form action={action} className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name="isMalariaCase"
        id="isMalariaCase"
        defaultChecked={defaultChecked}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <label htmlFor="isMalariaCase" className="text-slate-700">
        Admitting diagnosis is malaria
      </label>
    </form>
  );
}
