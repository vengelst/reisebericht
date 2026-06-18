import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  const classes = [
    "rounded-lg border border-[var(--color-border)]",
    "bg-[var(--color-surface)] shadow-sm",
    className,
  ].join(" ");
  return <div className={classes} {...props} />;
}

export function CardHeader({ className = "", ...props }: CardProps) {
  return (
    <div
      className={["p-6 border-b border-[var(--color-border)]", className].join(" ")}
      {...props}
    />
  );
}

export function CardTitle({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={["text-lg font-semibold text-foreground", className].join(" ")}
      {...props}
    />
  );
}

export function CardDescription({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={["text-sm text-[var(--color-muted)] mt-1", className].join(" ")}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: CardProps) {
  return <div className={["p-6", className].join(" ")} {...props} />;
}

export function CardFooter({ className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "p-6 border-t border-[var(--color-border)] flex items-center",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
