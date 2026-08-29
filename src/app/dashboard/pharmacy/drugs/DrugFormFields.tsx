// Shared field markup for the Add Drug / Edit Drug forms.

type DrugDefaults = {
  name?: string;
  genericName?: string | null;
  form?: string | null;
  unit?: string | null;
  unitPrice?: number | string;
  quantityOnHand?: number;
  reorderLevel?: number;
  nhisCovered?: boolean;
  isAvailable?: boolean;
};

export default function DrugFormFields({
  defaults,
}: {
  defaults?: DrugDefaults;
}) {
  const d = defaults ?? {};

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Drug Name"
          name="name"
          defaultValue={d.name}
          placeholder="e.g. Paracetamol 500mg"
          required
        />
        <Field
          label="Generic Name"
          name="genericName"
          defaultValue={d.genericName}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Form"
          name="form"
          defaultValue={d.form}
          placeholder="e.g. Tablet, Syrup, Injection"
        />
        <Field
          label="Unit"
          name="unit"
          defaultValue={d.unit}
          placeholder="e.g. tablet, sachet, vial"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field
          label="Unit Price (GHS)"
          name="unitPrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={d.unitPrice?.toString()}
          required
        />
        <Field
          label="Quantity on Hand"
          name="quantityOnHand"
          type="number"
          min="0"
          defaultValue={d.quantityOnHand?.toString() ?? "0"}
          required
        />
        <Field
          label="Reorder Level"
          name="reorderLevel"
          type="number"
          min="0"
          defaultValue={d.reorderLevel?.toString() ?? "0"}
          required
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="nhisCovered"
            defaultChecked={d.nhisCovered ?? false}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          On NHIS medicines list
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isAvailable"
            defaultChecked={d.isAvailable ?? true}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Available for dispensing
        </label>
      </div>
      <p className="text-xs text-slate-400 -mt-2">
        Unchecking &quot;On NHIS medicines list&quot; means patients pay cash
        for this drug. Unchecking &quot;Available&quot; hides it from new
        prescriptions and dispensing even if stock remains.
      </p>
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
