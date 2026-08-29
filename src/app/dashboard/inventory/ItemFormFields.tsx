import { INVENTORY_CATEGORIES } from "./labels";

type ItemDefaults = {
  name?: string;
  category?: string | null;
  unit?: string | null;
  reorderLevel?: number;
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
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Item Name
        </label>
        <input
          name="name"
          required
          defaultValue={d.name}
          placeholder="e.g. Surgical Gloves (Box of 100)"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            {INVENTORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Unit
          </label>
          <input
            name="unit"
            defaultValue={d.unit ?? undefined}
            placeholder="e.g. box, pack, piece"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {showStartingQuantity && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Starting Quantity
            </label>
            <input
              type="number"
              name="quantityOnHand"
              min="0"
              defaultValue="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reorder Level
          </label>
          <input
            type="number"
            name="reorderLevel"
            min="0"
            required
            defaultValue={d.reorderLevel?.toString() ?? "0"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {!showStartingQuantity && (
        <p className="text-xs text-slate-400">
          Quantity on hand changes only through recorded transactions on the
          item page — it can&apos;t be edited directly here.
        </p>
      )}
    </>
  );
}
