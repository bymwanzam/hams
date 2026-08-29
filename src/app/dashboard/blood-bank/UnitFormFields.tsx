import { BLOOD_GROUPS } from "./labels";

type UnitDefaults = {
  bloodGroup?: string;
  volumeMl?: number;
  collectedAt?: Date | null;
  expiresAt?: Date | null;
};

function toDateInputValue(date?: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function UnitFormFields({
  defaults,
}: {
  defaults?: UnitDefaults;
}) {
  const d = defaults ?? {};

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Blood Group
          </label>
          <select
            name="bloodGroup"
            required
            defaultValue={d.bloodGroup ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select…
            </option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Volume (mL)
          </label>
          <input
            type="number"
            name="volumeMl"
            min="1"
            required
            defaultValue={d.volumeMl?.toString() ?? "450"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Collection Date
          </label>
          <input
            type="date"
            name="collectedAt"
            required
            defaultValue={toDateInputValue(d.collectedAt) || today()}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Expiry Date
          </label>
          <input
            type="date"
            name="expiresAt"
            required
            defaultValue={toDateInputValue(d.expiresAt)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
  );
}
