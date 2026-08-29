// Shared field markup for the facility (hospital/branch) create and edit
// forms, mirroring the pattern used by the Patients module.

type FacilityDefaults = {
  name?: string;
  code?: string;
  address?: string | null;
  phone?: string | null;
  isMain?: boolean;
};

export default function FacilityFormFields({
  defaults,
}: {
  defaults?: FacilityDefaults;
}) {
  const d = defaults ?? {};

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Hospital / Branch Name"
          name="name"
          defaultValue={d.name}
          placeholder="e.g. Korle Bu Teaching Hospital"
          required
        />
        <Field
          label="Facility Code"
          name="code"
          defaultValue={d.code}
          placeholder="e.g. MAIN"
          required
        />
      </div>

      <Field
        label="Address"
        name="address"
        defaultValue={d.address}
        placeholder="e.g. Guggisberg Ave, Accra"
      />

      <Field label="Phone" name="phone" defaultValue={d.phone} />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isMain"
          defaultChecked={d.isMain ?? false}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Use as the main hospital
      </label>
      <p className="text-xs text-slate-400 -mt-2">
        The main hospital&apos;s name is shown on the sidebar, login page and
        ID cards. Only one facility can be the main hospital at a time.
      </p>
    </>
  );
}

function Field({
  label,
  name,
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
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
        type="text"
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
