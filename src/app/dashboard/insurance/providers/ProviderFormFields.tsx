import { PROVIDER_TYPES } from "../labels";

export default function ProviderFormFields({
  defaults,
}: {
  defaults?: { name?: string; type?: string };
}) {
  const d = defaults ?? {};

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Provider Name
        </label>
        <input
          name="name"
          required
          defaultValue={d.name}
          placeholder="e.g. National Health Insurance Scheme"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Type
        </label>
        <select
          name="type"
          required
          defaultValue={d.type ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select type…
          </option>
          {PROVIDER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
