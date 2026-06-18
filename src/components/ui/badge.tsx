import * as React from "react";

type BadgeTone = "neutral" | "info" | "success" | "muted";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30",
  info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  muted:
    "bg-[var(--color-surface-elevated)] text-[var(--color-muted)] border-[var(--color-border)]",
};

export function Badge({ className = "", tone = "neutral", ...props }: BadgeProps) {
  const classes = [
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
    "text-xs font-medium leading-5",
    toneClasses[tone],
    className,
  ].join(" ");
  return <span className={classes} {...props} />;
}
