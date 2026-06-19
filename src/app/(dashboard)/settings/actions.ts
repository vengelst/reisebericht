"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

type SettingsResult = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function fieldErrorsFrom(error: z.ZodError): SettingsResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return {
    error: error.issues[0]?.message ?? "Eingabe ist ungültig.",
    fieldErrors,
  };
}

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich.")
    .max(100, "Name ist zu lang (max. 100 Zeichen)."),
});

export async function updateProfile(
  formData: FormData,
): Promise<SettingsResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  await prisma.user.update({
    where: { id: userId },
    data: { displayName: parsed.data.displayName },
  });

  revalidatePath("/settings");
  return {
    success:
      "Anzeigename gespeichert. In der Navigation erscheint er nach der nächsten Anmeldung.",
  };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Bitte aktuelles Passwort eingeben."),
    newPassword: z
      .string()
      .min(8, "Neues Passwort muss mindestens 8 Zeichen haben."),
    confirmPassword: z.string().min(1, "Bitte neues Passwort bestätigen."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Die neuen Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

export async function changePassword(
  formData: FormData,
): Promise<SettingsResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Benutzer nicht gefunden." };

  const valid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!valid) {
    return {
      error: "Aktuelles Passwort ist falsch.",
      fieldErrors: { currentPassword: "Aktuelles Passwort ist falsch." },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: "Passwort erfolgreich geändert." };
}

export async function setTheme(formData: FormData): Promise<void> {
  const theme = formData.get("theme") === "light" ? "light" : "dark";
  const cookieStore = await cookies();
  cookieStore.set("theme", theme, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
    sameSite: "lax",
  });
}
