import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  errorMessage?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, hint, errorMessage, className = "", id, ...props },
    ref,
  ) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const classes = [
      "h-10 w-full rounded-md px-3 text-sm",
      "bg-[var(--color-surface-elevated)] text-foreground",
      "border border-[var(--color-border)]",
      "placeholder:text-[var(--color-muted)]",
      "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-60",
      className,
    ].join(" ");

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        ) : null}
        <input ref={ref} id={inputId} className={classes} {...props} />
        {errorMessage ? (
          <span className="text-xs text-red-400">{errorMessage}</span>
        ) : hint ? (
          <span className="text-xs text-[var(--color-muted)]">{hint}</span>
        ) : null}
      </div>
    );
  },
);
