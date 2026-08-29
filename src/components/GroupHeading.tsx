import type { Accent } from "@/lib/modules";
import { ACCENT_HEX } from "@/lib/modules";

// A section heading used everywhere a list of modules is broken out by
// group (the sidebar nav and the dashboard's module grid): an accent dot,
// the group name, and a hairline that fades from the group's own accent
// color into nothing — a soft, "smooth" way to separate sections without
// a hard rule or a colored background block.
export default function GroupHeading({
  label,
  accent,
  variant = "section",
}: {
  label: string;
  accent: Accent;
  variant?: "section" | "nav";
}) {
  const color = ACCENT_HEX[accent];

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color[500] }}
      />
      <span
        className={
          variant === "nav"
            ? "text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap"
            : "text-sm font-semibold text-slate-700 whitespace-nowrap"
        }
      >
        {label}
      </span>
      <span
        aria-hidden
        className="h-px flex-1 rounded-full"
        style={{
          background: `linear-gradient(to right, ${color[500]}66, transparent)`,
        }}
      />
    </div>
  );
}
