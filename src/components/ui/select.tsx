import * as React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  errorMessage?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, hint, errorMessage, className = "", id, children, ...props },
    ref,
  ) {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const classes = [
      "h-10 w-full rounded-md px-3 text-sm appearance-none",
      "bg-[var(--color-surface-elevated)] text-foreground",
      "border border-[var(--color-border)]",
      "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-60",
      // room for the chevron
      "pr-9",
      className,
    ].join(" ");

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select ref={ref} id={selectId} className={classes} {...props}>
            {children}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        {errorMessage ? (
          <span className="text-xs text-red-400">{errorMessage}</span>
        ) : hint ? (
          <span className="text-xs text-[var(--color-muted)]">{hint}</span>
        ) : null}
      </div>
    );
  },
);
