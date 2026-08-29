import type { ReactNode } from "react";

interface Props {
  /** Small uppercase line above the title — e.g. a hospital number or a back link. */
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned actions (buttons / links). */
  actions?: ReactNode;
}

/**
 * The repeated list/detail page opening: eyebrow + h1 + subtitle on the left,
 * actions on the right, closed by a 2px rule.
 */
export function PageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <div className="eyebrow mb-1">{eyebrow}</div> : null}
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="text-muted mt-1 mb-0">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
      <hr className="hr" />
    </div>
  );
}
