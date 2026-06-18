"use client";

type MicButtonProps = {
  supported: boolean;
  listening: boolean;
  onToggle: () => void;
};

export function MicButton({ supported, listening, onToggle }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!supported}
      title={
        supported
          ? listening
            ? "Aufnahme stoppen"
            : "Spracheingabe starten"
          : "Spracheingabe nicht unterstützt"
      }
      aria-pressed={listening}
      className={[
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors",
        supported
          ? listening
            ? "border-red-500/60 bg-red-500/15 text-red-300 animate-pulse"
            : "border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-foreground hover:border-[var(--color-accent)]/50"
          : "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-muted)] opacity-60",
      ].join(" ")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
      <span className="sr-only">Spracheingabe</span>
    </button>
  );
}
