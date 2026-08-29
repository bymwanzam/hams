import { ASSET_CATEGORIES } from "./labels";

type AssetDefaults = {
  name?: string;
  tag?: string;
  category?: string | null;
  purchaseDate?: Date | null;
  purchaseValue?: number | string | null;
};

function toDateInputValue(date?: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default function AssetFormFields({
  defaults,
}: {
  defaults?: AssetDefaults;
}) {
  const d = defaults ?? {};

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Asset Name
        </label>
        <input
          name="name"
          required
          defaultValue={d.name}
          placeholder="e.g. Portable X-ray Machine"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Asset Tag
          </label>
          <input
            name="tag"
            required
            defaultValue={d.tag}
            placeholder="e.g. FA-0001"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            name="category"
            defaultValue={d.category ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Purchase Date
          </label>
          <input
            type="date"
            name="purchaseDate"
            defaultValue={toDateInputValue(d.purchaseDate)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Purchase Value
          </label>
          <input
            type="number"
            name="purchaseValue"
            min="0"
            step="0.01"
            defaultValue={d.purchaseValue?.toString() ?? ""}
            placeholder="0.00"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
  );
}
