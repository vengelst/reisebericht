"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadMedia } from "@/app/(dashboard)/trips/[id]/media/actions";
import { Button } from "@/components/ui/button";
import {
  MEDIA_ACCEPT_ATTR,
  MEDIA_ACCEPTED_MIME,
  MEDIA_MAX_BYTES,
  formatFileSize,
} from "@/lib/media";

type UploadStatus = "ready" | "uploading" | "done" | "error" | "invalid";

type UploadItem = {
  id: string;
  file: File;
  url: string;
  status: UploadStatus;
  message?: string;
};

type UploadZoneProps = {
  tripId: string;
  defaultTripDayId?: string;
  defaultLocationId?: string;
};

let itemCounter = 0;

function validate(file: File): string | null {
  if (file.size > MEDIA_MAX_BYTES) return "Größer als 20 MB";
  if (file.type && !MEDIA_ACCEPTED_MIME.includes(file.type))
    return "Format nicht unterstützt";
  return null;
}

export function UploadZone({
  tripId,
  defaultTripDayId,
  defaultLocationId,
}: UploadZoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next: UploadItem[] = Array.from(fileList).map((file) => {
      const invalid = validate(file);
      itemCounter += 1;
      return {
        id: `item-${itemCounter}`,
        file,
        url: URL.createObjectURL(file),
        status: invalid ? "invalid" : "ready",
        message: invalid ?? undefined,
      };
    });
    setItems((prev) => [...prev, ...next]);
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function uploadAll() {
    setIsUploading(true);
    let anyUploaded = false;

    for (const item of items) {
      if (item.status !== "ready") continue;
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "uploading" } : it,
        ),
      );

      const formData = new FormData();
      formData.append("files", item.file);
      if (defaultTripDayId) formData.append("tripDayId", defaultTripDayId);
      if (defaultLocationId) formData.append("locationId", defaultLocationId);

      try {
        const result = await uploadMedia(tripId, formData);
        if (result?.error) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: "error", message: result.error }
                : it,
            ),
          );
        } else {
          anyUploaded = true;
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, status: "done" } : it,
            ),
          );
        }
      } catch {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: "error", message: "Upload fehlgeschlagen" }
              : it,
          ),
        );
      }
    }

    setIsUploading(false);
    if (anyUploaded) router.refresh();
  }

  const readyCount = items.filter((it) => it.status === "ready").length;
  const doneCount = items.filter((it) => it.status === "done").length;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ")
            inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
            : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50",
        ].join(" ")}
      >
        <span className="text-sm font-medium text-foreground">
          Dateien hierher ziehen oder klicken
        </span>
        <span className="text-xs text-[var(--color-muted)]">
          JPEG, PNG, WebP, HEIC · max. 20 MB pro Bild
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={MEDIA_ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="relative overflow-hidden rounded-md border border-[var(--color-border)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.file.name}
                  className="h-28 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-1 px-2 py-1 text-xs">
                  <span className="truncate text-[var(--color-muted)]">
                    {formatFileSize(item.file.size)}
                  </span>
                  <StatusBadge status={item.status} message={item.message} />
                </div>
                {item.status === "ready" || item.status === "invalid" ? (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                    aria-label="Entfernen"
                  >
                    ✕
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--color-muted)]">
              {isUploading
                ? "Upload läuft…"
                : doneCount > 0
                  ? `${doneCount} ${doneCount === 1 ? "Bild" : "Bilder"} hochgeladen`
                  : `${readyCount} bereit`}
            </span>
            <Button
              type="button"
              onClick={uploadAll}
              disabled={isUploading || readyCount === 0}
            >
              {isUploading
                ? "Upload läuft…"
                : `${readyCount} ${readyCount === 1 ? "Bild" : "Bilder"} hochladen`}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({
  status,
  message,
}: {
  status: UploadStatus;
  message?: string;
}) {
  if (status === "done")
    return <span className="text-emerald-400" title="Hochgeladen">✓</span>;
  if (status === "uploading")
    return <span className="text-[var(--color-accent)]">…</span>;
  if (status === "error" || status === "invalid")
    return (
      <span className="text-red-400" title={message}>
        ✕
      </span>
    );
  return null;
}
