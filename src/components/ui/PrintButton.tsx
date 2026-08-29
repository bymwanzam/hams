"use client";

import { Button } from "./Button";

/** Triggers the browser print dialog; hidden in the printout itself. */
export function PrintButton({ children = "Print" }: { children?: React.ReactNode }) {
  return (
    <Button variant="secondary" className="print:hidden" onClick={() => window.print()}>
      {children}
    </Button>
  );
}
