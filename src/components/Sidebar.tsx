import { MODULE_GROUPS } from "@/lib/modules";
import { getFacilityName } from "@/lib/facility";
import { filterModuleGroupsForRole } from "@/lib/access";
import { auth } from "@/auth";
import SidebarNav from "@/components/SidebarNav";

export default async function Sidebar() {
  const [hospitalName, session] = await Promise.all([getFacilityName(), auth()]);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const visibleGroups = filterModuleGroupsForRole(MODULE_GROUPS, role);

  return (
    <aside
      className="print:hidden w-64 shrink-0 h-screen overflow-y-auto"
      style={{ borderRight: "2px solid var(--color-divider)" }}
    >
      <div
        className="px-5 py-5"
        style={{ borderBottom: "2px solid var(--color-divider)" }}
      >
        <p className="nav-brand" style={{ marginRight: 0 }}>
          {hospitalName}
        </p>
        <p className="eyebrow mt-1">Hospital Admin &amp; Mgmt System</p>
      </div>

      <SidebarNav visibleGroups={visibleGroups} />
    </aside>
  );
}
