// Shared field markup for the patient registration and edit forms. Kept as
// a server component (no interactivity needed) so both pages stay in sync
// without duplicating ~80 lines of form markup.

import { Field, Input, Select, FileInput } from "@/components/ui";

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
      <Field
        label="Photo"
        hint={
          <>
            JPEG, PNG or WebP, up to 4MB.
            {currentPhotoUrl && " Leave blank to keep the current photo."}
          </>
        }
      >
        {currentPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentPhotoUrl}
            alt=""
            className="mb-2 h-16 w-16 rounded-full object-cover border border-slate-200"
          />
        )}
        <FileInput name="photo" accept="image/jpeg,image/png,image/webp" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" htmlFor="pf-firstName">
          <Input id="pf-firstName" name="firstName" defaultValue={d.firstName ?? ""} required />
        </Field>
        <Field label="Last Name" htmlFor="pf-lastName">
          <Input id="pf-lastName" name="lastName" defaultValue={d.lastName ?? ""} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of Birth" htmlFor="pf-dob">
          <Input
            id="pf-dob"
            name="dateOfBirth"
            type="date"
            defaultValue={d.dateOfBirth ?? ""}
            required
          />
        </Field>
        <Field label="Gender" htmlFor="pf-gender">
          <Select id="pf-gender" name="gender" required defaultValue={d.gender ?? "MALE"}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" htmlFor="pf-phone">
          <Input id="pf-phone" name="phone" defaultValue={d.phone ?? ""} />
        </Field>
        <Field label="Email" htmlFor="pf-email">
          <Input id="pf-email" name="email" type="email" defaultValue={d.email ?? ""} />
        </Field>
      </div>

      <Field label="Address" htmlFor="pf-address">
        <Input id="pf-address" name="address" defaultValue={d.address ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Next of Kin Name" htmlFor="pf-nokName">
          <Input id="pf-nokName" name="nextOfKinName" defaultValue={d.nextOfKinName ?? ""} />
        </Field>
        <Field label="Next of Kin Phone" htmlFor="pf-nokPhone">
          <Input id="pf-nokPhone" name="nextOfKinPhone" defaultValue={d.nextOfKinPhone ?? ""} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Blood Group" htmlFor="pf-blood">
          <Input
            id="pf-blood"
            name="bloodGroup"
            placeholder="e.g. O+"
            defaultValue={d.bloodGroup ?? ""}
          />
        </Field>
        <Field label="Insurance Status" htmlFor="pf-ins">
          <Select
            id="pf-ins"
            name="insuranceStatus"
            required
            defaultValue={d.insuranceStatus ?? "CASH"}
          >
            <option value="CASH">Cash</option>
            <option value="INSURED">Insured</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="NHIS Number" htmlFor="pf-nhis">
          <Input id="pf-nhis" name="nhisNumber" defaultValue={d.nhisNumber ?? ""} />
        </Field>
        <Field label="Ghana Card Number" htmlFor="pf-ghc">
          <Input
            id="pf-ghc"
            name="ghanaCardNumber"
            placeholder="GHA-XXXXXXXXX-X"
            defaultValue={d.ghanaCardNumber ?? ""}
          />
        </Field>
      </div>
    </>
  );
}
