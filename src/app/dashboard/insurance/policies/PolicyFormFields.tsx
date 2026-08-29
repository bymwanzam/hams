type ProviderOption = { id: string; name: string };

export default function PolicyFormFields({
  providers,
  defaults,
}: {
  providers: ProviderOption[];
  defaults?: { providerId?: string; policyNumber?: string; expiryDate?: string };
}) {
  const d = defaults ?? {};

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Insurance Provider
        </label>
        <select
          name="providerId"
          required
          defaultValue={d.providerId ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select provider…
          </option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Policy / Membership Number
        </label>
        <input
          name="policyNumber"
          required
          defaultValue={d.policyNumber}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Expiry Date
        </label>
        <input
          type="date"
          name="expiryDate"
          defaultValue={d.expiryDate}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </>
  );
}
