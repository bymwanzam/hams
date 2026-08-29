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
        <label className="form-label">
          Provider Name
        </label>
        <input
          name="name"
          required
          defaultValue={d.name}
          placeholder="e.g. National Health Insurance Scheme"
          className="input"
        />
      </div>

      <div>
        <label className="form-label">
          Type
        </label>
        <select
          name="type"
          required
          defaultValue={d.type ?? ""}
          className="input"
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
