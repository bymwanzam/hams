import { getModuleAccent } from "@/lib/modules";

// Stamps this module's group accent (Administration -> indigo) onto every
// page under /dashboard/audit via a `data-accent` attribute — same pattern
// as backup/layout.tsx.
export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-accent={getModuleAccent("audit")} className="contents">
      {children}
    </div>
  );
}
