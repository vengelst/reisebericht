import * as React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  errorMessage?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, errorMessage, className = "", id, rows = 4, ...props },
    ref,
  ) {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const classes = [
      "w-full rounded-md px-3 py-2 text-sm",
      "bg-[var(--color-surface-elevated)] text-foreground",
      "border border-[var(--color-border)]",
      "placeholder:text-[var(--color-muted)]",
      "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-60",
      "resize-y",
      className,
    ].join(" ");

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={classes}
          {...props}
        />
        {errorMessage ? (
          <span className="text-xs text-red-400">{errorMessage}</span>
        ) : hint ? (
          <span className="text-xs text-[var(--color-muted)]">{hint}</span>
        ) : null}
      </div>
    );
  },
);
