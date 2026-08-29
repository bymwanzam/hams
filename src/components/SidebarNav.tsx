"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCENT_HEX, type ModuleGroup } from "@/lib/modules";
import GroupHeading from "@/components/GroupHeading";

// Split out from Sidebar (a Server Component, for the hospital-name/session
// fetch) because highlighting the current section needs the client-side
// pathname — Server Components don't have access to that.
export default function SidebarNav({
  visibleGroups,
}: {
  visibleGroups: ModuleGroup[];
}) {
  const pathname = usePathname();

  return (
    <nav className="px-3 py-4 space-y-5">
      <Link
        href="/dashboard"
        className={`block rounded-lg border px-3 py-2 text-sm font-medium ${
          pathname === "/dashboard"
            ? "border-slate-300 bg-slate-100 text-slate-900"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        Overview
      </Link>

      {visibleGroups.map((group) => {
        const color = ACCENT_HEX[group.accent];
        return (
          <div key={group.group}>
            <GroupHeading
              label={group.group}
              accent={group.accent}
              variant="nav"
            />
            <div className="mt-2 space-y-1.5">
              {group.modules.map((m) => {
                const active = pathname.startsWith(`/dashboard/${m.slug}`);
                return (
                  <Link
                    key={m.slug}
                    href={`/dashboard/${m.slug}`}
                    // Same card classes the rest of the app uses for
                    // clickable panels — picks up the global hover-lift
                    // transition for free (see globals.css) without any
                    // extra CSS here.
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: color[500],
                      ...(active
                        ? {
                            backgroundColor: color[50],
                            color: color[700],
                            fontWeight: 500,
                          }
                        : undefined),
                    }}
                  >
                    <span className={active ? "" : "text-slate-600"}>
                      {m.label}
                    </span>
                    {m.status === "planned" && (
                      <span className="text-[10px] text-slate-300 shrink-0">
                        soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
