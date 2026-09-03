import { INVENTORY_CATEGORIES } from "./labels";

type ItemDefaults = {
  name?: string;
  category?: string | null;
  unit?: string | null;
  reorderLevel?: number;
  batchNumber?: string | null;
  /** yyyy-mm-dd */
  expiryDate?: string | null;
};

export default function ItemFormFields({
  defaults,
  showStartingQuantity = false,
}: {
  defaults?: ItemDefaults;
  showStartingQuantity?: boolean;
}) {
  const d = defaults ?? {};

  return (
    <>
      <div>
        <label className="form-label">
          Item Name
        </label>
        <input
          name="name"
          required
          defaultValue={d.name}
          placeholder="e.g. Surgical Gloves (Box of 100)"
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            {INVENTORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">
            Unit
          </label>
          <input
            name="unit"
            defaultValue={d.unit ?? undefined}
            placeholder="e.g. box, pack, piece"
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {showStartingQuantity && (
          <div>
            <label className="form-label">
              Starting Quantity
            </label>
            <input
              type="number"
              name="quantityOnHand"
              min="0"
              defaultValue="0"
              className="input"
            />
          </div>
        )}
        <div>
          <label className="form-label">
            Reorder Level
          </label>
          <input
            type="number"
            name="reorderLevel"
            min="0"
            required
            defaultValue={d.reorderLevel?.toString() ?? "0"}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Batch No.</label>
          <input
            name="batchNumber"
            defaultValue={d.batchNumber ?? undefined}
            placeholder="e.g. B-4471"
            className="input"
          />
        </div>
        <div>
          <label className="form-label">Expiry Date</label>
          <input
            type="date"
            name="expiryDate"
            defaultValue={d.expiryDate ?? undefined}
            className="input"
          />
        </div>
      </div>
      {!showStartingQuantity && (
        <p className="eyebrow">
          Quantity on hand changes only through recorded transactions on the
          item page — it can&apos;t be edited directly here.
        </p>
      )}
    </>
  );
}
