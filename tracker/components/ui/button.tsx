import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "chip" | "stepper";

type Common = {
  variant?: ButtonVariant;
  pending?: boolean;
  pendingLabel?: string;
  className?: string;
  children: ReactNode;
};

function classes(variant: ButtonVariant, className?: string): string {
  return ["btn", `btn-${variant}`, className].filter(Boolean).join(" ");
}

export function Button({
  variant = "secondary",
  pending = false,
  pendingLabel = "Saving…",
  className,
  children,
  disabled,
  type = "button",
  ref,
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> }) {
  const isDisabled = Boolean(disabled || pending);
  return (
    <button
      ref={ref}
      type={type}
      className={classes(variant, className)}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "secondary",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  const classNameValue = classes(variant, className);
  if (href.startsWith("/api/") || href.startsWith("http")) {
    return (
      <a className={classNameValue} href={href}>
        {children}
      </a>
    );
  }
  return (
    <Link className={classNameValue} href={href}>
      {children}
    </Link>
  );
}
