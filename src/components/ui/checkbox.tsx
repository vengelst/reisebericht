import * as React from "react";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, hint, className = "", id, ...props }, ref) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-start gap-3 text-sm"
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={[
            "mt-0.5 h-4 w-4 shrink-0 rounded border border-[var(--color-border)]",
            "bg-[var(--color-surface-elevated)] accent-[var(--color-accent)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
            className,
          ].join(" ")}
          {...props}
        />
        <span className="flex flex-col gap-0.5">
          {label ? (
            <span className="font-medium text-foreground">{label}</span>
          ) : null}
          {hint ? (
            <span className="text-xs text-[var(--color-muted)]">{hint}</span>
          ) : null}
        </span>
      </label>
    );
  },
);
