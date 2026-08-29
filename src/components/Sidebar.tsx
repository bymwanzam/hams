import { MODULE_GROUPS } from "@/lib/modules";
import { getPrimaryFacilityName } from "@/lib/facility";
import { filterModuleGroupsForRole } from "@/lib/access";
import { auth } from "@/auth";
import SidebarNav from "@/components/SidebarNav";

export default async function Sidebar() {
  const [hospitalName, session] = await Promise.all([
    getPrimaryFacilityName(),
    auth(),
  ]);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const visibleGroups = filterModuleGroupsForRole(MODULE_GROUPS, role);

  return (
    <aside className="print:hidden w-64 shrink-0 border-r border-slate-200 bg-white h-screen overflow-y-auto">
      <div className="px-5 py-5 border-b border-slate-100">
        <p className="text-lg font-semibold text-slate-800">{hospitalName}</p>
        <p className="text-xs text-slate-400">Hospital Admin &amp; Mgmt System</p>
      </div>

      <SidebarNav visibleGroups={visibleGroups} />
    </aside>
  );
}
