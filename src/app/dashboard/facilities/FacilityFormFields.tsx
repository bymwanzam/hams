// Field markup for the single hospital registration / edit form,
// mirroring the pattern used by the Patients module.

type FacilityDefaults = {
  name?: string;
  address?: string | null;
  phone?: string | null;
};

export default function FacilityFormFields({
  defaults,
}: {
  defaults?: FacilityDefaults;
}) {
  const d = defaults ?? {};

  return (
    <>
      <Field
        label="Hospital Name"
        name="name"
        defaultValue={d.name}
        placeholder="e.g. Korle Bu Teaching Hospital"
        required
      />

      <Field
        label="Address"
        name="address"
        defaultValue={d.address}
        placeholder="e.g. Guggisberg Ave, Accra"
      />

      <Field label="Phone" name="phone" defaultValue={d.phone} />
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
      <label className="form-label">
        {label}
      </label>
      <input
        type="text"
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="input"
      />
    </div>
  );
}
