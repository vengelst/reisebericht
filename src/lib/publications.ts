// Shared, framework-agnostic helpers for publications (safe to import in client
// components — must not import Prisma, node:crypto, or other server-only code).

export const PUBLICATION_STATUSES = ["DRAFT", "PUBLISHED"] as const;

export type PublicationStatusValue = (typeof PUBLICATION_STATUSES)[number];

export type PublicationActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatusValue, string> =
  {
    DRAFT: "Entwurf",
    PUBLISHED: "Veröffentlicht",
  };

/** Relative share path. The full URL is built in the UI via window.location.origin. */
export function shareUrl(token: string): string {
  return `/share/${token}`;
}
