// Shared field markup for the patient registration and edit forms. Kept as
// a server component (no interactivity needed) so both pages stay in sync
// without duplicating ~80 lines of form markup.

type PatientDefaults = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // yyyy-mm-dd
  gender?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  bloodGroup?: string | null;
  nhisNumber?: string | null;
  ghanaCardNumber?: string | null;
  insuranceStatus?: string | null;
};

export default function PatientFormFields({
  defaults,
  currentPhotoUrl,
}: {
  defaults?: PatientDefaults;
  currentPhotoUrl?: string | null;
}) {
  const d = defaults ?? {};

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Photo
        </label>
        {currentPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentPhotoUrl}
            alt=""
            className="w-16 h-16 rounded-full object-cover border border-slate-200 mb-2"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <p className="text-xs text-slate-400 mt-1">
          JPEG, PNG or WebP, up to 4MB.
          {currentPhotoUrl && " Leave blank to keep the current photo."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="First Name"
          name="firstName"
          defaultValue={d.firstName}
          required
        />
        <Field
          label="Last Name"
          name="lastName"
          defaultValue={d.lastName}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          defaultValue={d.dateOfBirth}
          required
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gender
          </label>
          <select
            name="gender"
            required
            defaultValue={d.gender ?? "MALE"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" name="phone" defaultValue={d.phone} />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={d.email}
        />
      </div>

      <Field label="Address" name="address" defaultValue={d.address} />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Next of Kin Name"
          name="nextOfKinName"
          defaultValue={d.nextOfKinName}
        />
        <Field
          label="Next of Kin Phone"
          name="nextOfKinPhone"
          defaultValue={d.nextOfKinPhone}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Blood Group"
          name="bloodGroup"
          placeholder="e.g. O+"
          defaultValue={d.bloodGroup}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Insurance Status
          </label>
          <select
            name="insuranceStatus"
            required
            defaultValue={d.insuranceStatus ?? "CASH"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CASH">Cash</option>
            <option value="INSURED">Insured</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="NHIS Number"
          name="nhisNumber"
          defaultValue={d.nhisNumber}
        />
        <Field
          label="Ghana Card Number"
          name="ghanaCardNumber"
          placeholder="GHA-XXXXXXXXX-X"
          defaultValue={d.ghanaCardNumber}
        />
      </div>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
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
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
