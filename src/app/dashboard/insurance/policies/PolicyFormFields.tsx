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
        <label className="form-label">
          Insurance Provider
        </label>
        <select
          name="providerId"
          required
          defaultValue={d.providerId ?? ""}
          className="input"
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
        <label className="form-label">
          Policy / Membership Number
        </label>
        <input
          name="policyNumber"
          required
          defaultValue={d.policyNumber}
          className="input"
        />
      </div>

      <div>
        <label className="form-label">
          Expiry Date
        </label>
        <input
          type="date"
          name="expiryDate"
          defaultValue={d.expiryDate}
          className="input"
        />
      </div>
    </>
  );
}
