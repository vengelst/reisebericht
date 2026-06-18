import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:bg-[var(--color-muted)]",
  secondary:
    "bg-[var(--color-surface-elevated)] text-foreground hover:bg-[var(--color-border)] border border-[var(--color-border)]",
  ghost:
    "bg-transparent text-foreground hover:bg-[var(--color-surface-elevated)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className = "", variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) {
    const classes = [
      "inline-flex items-center justify-center gap-2 rounded-md font-medium",
      "transition-colors duration-150",
      "disabled:cursor-not-allowed disabled:opacity-70",
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].join(" ");

    return <button ref={ref} type={type} className={classes} {...props} />;
  },
);
