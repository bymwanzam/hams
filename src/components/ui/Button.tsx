import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost";

interface CommonProps {
  variant?: Variant;
  /** Square icon-only button. */
  icon?: boolean;
  /** Full-width; label sits flush left (Modernist wide-button rule). */
  block?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & {
    href: string;
  };

function btnClass(variant: Variant, icon?: boolean, block?: boolean, className?: string) {
  return cn("btn", `btn-${variant}`, icon && "btn-icon", block && "btn-block", className);
}

/**
 * The one button. `.btn` + a Modernist variant. Renders an <a> (next/link)
 * when `href` is set, otherwise a <button> — pass `type="submit"` for form
 * submits so the app-wide press animation and native submit both fire.
 */
export function Button(props: ButtonProps | LinkProps) {
  const { variant = "secondary", icon, block, className, children, ...rest } = props;
  const cls = btnClass(variant, icon, block, className);

  if ("href" in rest && typeof rest.href === "string") {
    const linkRest = rest as Omit<LinkProps, keyof CommonProps>;
    return (
      <Link {...linkRest} className={cls}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as Omit<ButtonProps, keyof CommonProps>;
  return (
    <button {...buttonRest} type={buttonRest.type ?? "button"} className={cls}>
      {children}
    </button>
  );
}
