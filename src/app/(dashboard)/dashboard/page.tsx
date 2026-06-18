import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Übersicht</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Hier finden Sie alle Ihre Reisen.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-muted)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium">Noch keine Reisen vorhanden</h2>
            <p className="max-w-md text-sm text-[var(--color-muted)]">
              Legen Sie Ihre erste Reise an, um Tage, Orte und Notizen zu erfassen.
            </p>
          </div>
          <Button disabled>Neue Reise (bald verfügbar)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
