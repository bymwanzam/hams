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
        className="row-link"
        style={
          pathname === "/dashboard"
            ? { background: "var(--color-surface)", fontWeight: 800 }
            : undefined
        }
      >
        Overview
      </Link>

      {visibleGroups.map((group) => {
        const color = ACCENT_HEX[group.accent];
        return (
          <div key={group.group}>
            <GroupHeading label={group.group} accent={group.accent} />
            <div className="mt-2">
              {group.modules.map((m) => {
                const active = pathname.startsWith(`/dashboard/${m.slug}`);
                return (
                  <Link
                    key={m.slug}
                    href={`/dashboard/${m.slug}`}
                    className="row-link"
                    style={{
                      borderLeft: `2px solid ${color[500]}`,
                      ...(active
                        ? {
                            background: "var(--color-surface)",
                            fontWeight: 800,
                          }
                        : undefined),
                    }}
                  >
                    <span className={active ? undefined : "text-muted"}>
                      {m.label}
                    </span>
                    {m.status === "planned" && (
                      <span className="eyebrow shrink-0">soon</span>
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
