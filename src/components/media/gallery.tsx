"use client";

import { useCallback, useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/media";

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const show = useCallback(
    (delta: number) =>
      setActiveIndex((current) => {
        if (current === null) return current;
        const next = (current + delta + images.length) % images.length;
        return next;
      }),
    [images.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") show(1);
      if (event.key === "ArrowLeft") show(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeIndex, close, show]);

  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center text-sm text-[var(--color-muted)]">
        Noch keine Bilder. Laden Sie Fotos hoch.
      </div>
    );
  }

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative block aspect-square w-full overflow-hidden rounded-md border border-[var(--color-border)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.mdUrl}
                alt={image.caption ?? "Bild"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {image.isHighlight ? (
                <span
                  className="absolute left-1.5 top-1.5 text-amber-300 drop-shadow"
                  title="Highlight"
                >
                  ★
                </span>
              ) : null}
              {image.isCover ? (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  Titelbild
                </span>
              ) : null}
              {image.caption ? (
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-left text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {image.caption}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
            aria-label="Schließen"
          >
            ✕ Schließen
          </button>

          {images.length > 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                show(-1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20"
              aria-label="Vorheriges Bild"
            >
              ‹
            </button>
          ) : null}

          <figure
            className="flex max-h-full max-w-4xl flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.lgUrl}
              alt={active.caption ?? "Bild"}
              className="max-h-[75vh] w-auto rounded-md object-contain"
            />
            <figcaption className="flex items-center gap-4 text-sm text-white/80">
              {active.caption ? <span>{active.caption}</span> : null}
              <a
                href={active.originalUrl}
                download
                className="text-[var(--color-accent)] hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                Herunterladen
              </a>
            </figcaption>
          </figure>

          {images.length > 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                show(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20"
              aria-label="Nächstes Bild"
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
