import Link from "next/link";
import { searchPatients } from "./actions";
import {
  PageHeader,
  Button,
  Card,
  Table,
  Th,
  Td,
  TableEmpty,
} from "@/components/ui";

type PatientRow = Awaited<ReturnType<typeof searchPatients>>[number];

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const patients = await searchPatients(q ?? "");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Registration"
        subtitle="Front desk / OPD / IPD registration."
        actions={
          <Button href="/dashboard/patients/new" variant="primary">
            + Register Patient
          </Button>
        }
      />

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, hospital no. or phone"
          className="input"
        />
      </form>

      <Card flush accented>
        <Table>
          <thead>
            <tr>
              <Th>Hospital No.</Th>
              <Th>Name</Th>
              <Th>Gender</Th>
              <Th>Phone</Th>
              <Th>Registered</Th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 && (
              <TableEmpty colSpan={5}>No patients found.</TableEmpty>
            )}
            {patients.map((p: PatientRow) => (
              <tr key={p.id}>
                <Td>
                  <Link href={`/dashboard/patients/${p.id}`}>
                    {p.hospitalNumber}
                  </Link>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoUrl}
                        alt=""
                        className="grayscale h-7 w-7 object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center bg-[var(--color-neutral-200)] text-[10px] font-medium text-[var(--color-neutral-600)]">
                        {p.firstName[0]}
                        {p.lastName[0]}
                      </div>
                    )}
                    {p.firstName} {p.lastName}
                  </div>
                </Td>
                <Td>{p.gender}</Td>
                <Td>{p.phone ?? "—"}</Td>
                <Td>{new Date(p.createdAt).toLocaleDateString()}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
