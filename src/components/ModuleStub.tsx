import { getModule } from "@/lib/modules";

export default function ModuleStub({ slug }: { slug: string }) {
  const mod = getModule(slug);

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-slate-800">
        {mod?.label ?? slug}
      </h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">{mod?.description}</p>

      <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
        <p className="text-sm text-slate-500">
          This module is scaffolded in the data model and navigation but not
          yet built.
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Follow the pattern in{" "}
          <code className="bg-slate-100 px-1 rounded">
            src/app/dashboard/patients
          </code>{" "}
          to add it: a Prisma-backed list page, a server action for writes,
          and a detail page.
        </p>
      </div>
    </div>
  );
}
