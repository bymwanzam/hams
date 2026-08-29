import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePatient } from "../../actions";
import PatientFormFields from "../../PatientFormFields";

export default async function EditPatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  const updatePatientWithId = updatePatient.bind(null, patient.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs text-slate-400">{patient.hospitalNumber}</p>
        <h1 className="text-xl font-semibold text-slate-800">
          Edit {patient.firstName} {patient.lastName}
        </h1>
        <p className="text-sm text-slate-500">
          <Link
            href={`/dashboard/patients/${patient.id}`}
            className="text-blue-600 hover:underline"
          >
            ← Back to patient
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={updatePatientWithId}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <PatientFormFields
          currentPhotoUrl={patient.photoUrl}
          defaults={{
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email,
            address: patient.address,
            nextOfKinName: patient.nextOfKinName,
            nextOfKinPhone: patient.nextOfKinPhone,
            bloodGroup: patient.bloodGroup,
            nhisNumber: patient.nhisNumber,
            ghanaCardNumber: patient.ghanaCardNumber,
            insuranceStatus: patient.insuranceStatus,
          }}
        />

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Changes
          </button>
          <Link
            href={`/dashboard/patients/${patient.id}`}
            className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
