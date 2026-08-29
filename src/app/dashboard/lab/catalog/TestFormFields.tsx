import { LAB_TEST_CATEGORIES, SAMPLE_TYPES } from "../labels";

type TestDefaults = {
  name?: string;
  code?: string;
  category?: string | null;
  sampleType?: string | null;
  price?: number | string;
  isAvailable?: boolean;
};

export default function TestFormFields({
  defaults,
}: {
  defaults?: TestDefaults;
}) {
  const d = defaults ?? {};

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Test Name"
          name="name"
          defaultValue={d.name}
          placeholder="e.g. Full Blood Count"
          required
        />
        <Field
          label="Code"
          name="code"
          defaultValue={d.code}
          placeholder="e.g. FBC"
          required
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
            {LAB_TEST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sample Type
          </label>
          <select
            name="sampleType"
            defaultValue={d.sampleType ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {SAMPLE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Field
        label="Price (GHS)"
        name="price"
        type="number"
        step="0.01"
        min="0"
        defaultValue={d.price?.toString()}
        required
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isAvailable"
          defaultChecked={d.isAvailable ?? true}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Available for ordering
      </label>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  step,
  min,
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  min?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        step={step}
        min={min}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
