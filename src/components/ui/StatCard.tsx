import type { ReactNode } from "react";
import { ACCENT_HEX, type Accent } from "@/lib/modules";

// A KPI tile: a Modernist card with a 2px coloured left rule and a big
// number. Same pattern the dashboard overview uses inline
// (src/app/dashboard/page.tsx); factored out here for the Pharmacy and
// Inventory dashboards.

type Hue = Accent | "red";

function hue(h: Hue): string {
  return h === "red" ? "var(--color-accent)" : ACCENT_HEX[h][500];
}
function inkFor(h: Hue): string {
  return h === "red" ? "var(--color-accent-700)" : ACCENT_HEX[h][700];
}

export function StatCard({
  label,
  value,
  accent = "sky",
  emphasis = true,
}: {
  label: ReactNode;
  value: ReactNode;
  accent?: Hue;
  /** Colour the number to match the rule (default) or leave it ink. */
  emphasis?: boolean;
}) {
  return (
    <div className="card" style={{ borderLeft: `2px solid ${hue(accent)}` }}>
      <p
        className="mb-1 text-[28px] font-[800] leading-none"
        style={emphasis ? { color: inkFor(accent) } : undefined}
      >
        {value}
      </p>
      <p className="text-muted mb-0 text-[13px]">{label}</p>
    </div>
  );
}
