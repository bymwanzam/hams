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
        <label className="form-label">
          Asset Name
        </label>
        <input
          name="name"
          required
          defaultValue={d.name}
          placeholder="e.g. Portable X-ray Machine"
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Asset Tag
          </label>
          <input
            name="tag"
            required
            defaultValue={d.tag}
            placeholder="e.g. FA-0001"
            className="input"
          />
        </div>
        <div>
          <label className="form-label">
            Category
          </label>
          <select
            name="category"
            defaultValue={d.category ?? ""}
            className="input"
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
          <label className="form-label">
            Purchase Date
          </label>
          <input
            type="date"
            name="purchaseDate"
            defaultValue={toDateInputValue(d.purchaseDate)}
            className="input"
          />
        </div>
        <div>
          <label className="form-label">
            Purchase Value
          </label>
          <input
            type="number"
            name="purchaseValue"
            min="0"
            step="0.01"
            defaultValue={d.purchaseValue?.toString() ?? ""}
            placeholder="0.00"
            className="input"
          />
        </div>
      </div>
    </>
  );
}
