import { getModuleAccent } from "@/lib/modules";

// Stamps this module's group accent onto every page under /dashboard/id-cards
// (list, new, detail, edit) via a `data-accent` attribute that globals.css
// keys its color rules off of — see the "Accent system" section there.
// `className="contents"` keeps this wrapper out of the layout box model
// entirely, so it can't affect flex/grid sizing on any page it wraps.
export default function IdCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-accent={getModuleAccent("id-cards")} className="contents">
      {children}
    </div>
  );
}
