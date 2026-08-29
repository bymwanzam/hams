import { getModuleAccent } from "@/lib/modules";

// Stamps this module's group accent (Administration -> indigo) onto every
// page under /dashboard/backup via a `data-accent` attribute — see
// facilities/layout.tsx, the pattern this is copied from.
export default function BackupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-accent={getModuleAccent("backup")} className="contents">
      {children}
    </div>
  );
}
