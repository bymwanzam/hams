import Link from "next/link";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

interface CommonProps {
  /** Add the 2px group-accent left rule (needs a `data-accent` ancestor). */
  accented?: boolean;
  elevation?: "sm" | "md" | "lg";
  /** Clip overflow and drop padding — for tables/lists that run to the edge. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

type DivProps = CommonProps &
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & {
    href: string;
  };

function cardClass(o: Omit<CommonProps, "children">) {
  return cn(
    "card",
    o.accented && "card-accent",
    o.elevation && `elev-${o.elevation}`,
    o.flush && "overflow-hidden p-0",
    o.className,
  );
}

/** Surface-filled Modernist card. Renders a hover-lifting link when `href` set. */
export function Card(props: DivProps | LinkProps) {
  const { accented, elevation, flush, className, children, ...rest } = props;
  const cls = cardClass({ accented, elevation, flush, className });

  if ("href" in rest && typeof rest.href === "string") {
    const linkRest = rest as Omit<LinkProps, keyof CommonProps>;
    return (
      <Link {...linkRest} className={cls}>
        {children}
      </Link>
    );
  }
  const divRest = rest as Omit<DivProps, keyof CommonProps>;
  return (
    <div {...divRest} className={cls}>
      {children}
    </div>
  );
}

export function CardKicker({ children }: { children: ReactNode }) {
  return <div className="card-kicker">{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="card-title">{children}</div>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <p className="card-body">{children}</p>;
}

export function CardMeta({ children }: { children: ReactNode }) {
  return <div className="card-meta">{children}</div>;
}
