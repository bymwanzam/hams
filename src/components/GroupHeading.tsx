import type { Accent } from "@/lib/modules";
import { ACCENT_HEX } from "@/lib/modules";

// A section heading used wherever a list of modules is broken out by group
// (the sidebar nav and the dashboard's module grid). Modernist: an h6 in
// small caps with a short 2px rule in the group's own accent — no dot, no
// gradient, structure over decoration.
export default function GroupHeading({
  label,
  accent,
}: {
  label: string;
  accent: Accent;
}) {
  const color = ACCENT_HEX[accent];

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="h-[2px] w-4 shrink-0"
        style={{ background: color[500] }}
      />
      <h6 className="mb-0 whitespace-nowrap">{label}</h6>
    </div>
  );
}
