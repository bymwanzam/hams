import { getModule } from "@/lib/modules";
import { Card } from "@/components/ui";

export default function ModuleStub({ slug }: { slug: string }) {
  const mod = getModule(slug);

  return (
    <div className="max-w-xl">
      <h1>{mod?.label ?? slug}</h1>
      <p className="text-muted mt-1 mb-6">{mod?.description}</p>

      <Card className="items-center text-center">
        <p className="text-muted mb-0 text-sm">
          This module is scaffolded in the data model and navigation but not
          yet built.
        </p>
        <p className="text-muted mb-0 text-xs">
          Follow the pattern in{" "}
          <code className="bg-[var(--color-neutral-200)] px-1">
            src/app/dashboard/patients
          </code>{" "}
          to add it: a Prisma-backed list page, a server action for writes,
          and a detail page.
        </p>
      </Card>
    </div>
  );
}
