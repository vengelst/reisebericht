import { Badge } from "@/components/ui/badge";
import {
  TRIP_STATUS_LABELS,
  TRIP_STATUS_TONES,
  TRIP_VISIBILITY_LABELS,
  type TripStatusValue,
  type TripVisibilityValue,
} from "@/lib/trips";

export function TripStatusBadge({ status }: { status: TripStatusValue }) {
  return <Badge tone={TRIP_STATUS_TONES[status]}>{TRIP_STATUS_LABELS[status]}</Badge>;
}

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function VisibilityGlyph({ visibility }: { visibility: TripVisibilityValue }) {
  switch (visibility) {
    case "PRIVATE":
      return (
        <svg {...iconProps}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "UNLISTED":
      return (
        <svg {...iconProps}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "PUBLIC":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}

export function VisibilityIcon({
  visibility,
  withLabel = false,
  className = "",
}: {
  visibility: TripVisibilityValue;
  withLabel?: boolean;
  className?: string;
}) {
  const label = TRIP_VISIBILITY_LABELS[visibility];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 text-[var(--color-muted)]",
        className,
      ].join(" ")}
      title={label}
    >
      <VisibilityGlyph visibility={visibility} />
      {withLabel ? <span className="text-sm">{label}</span> : null}
      <span className="sr-only">{label}</span>
    </span>
  );
}
