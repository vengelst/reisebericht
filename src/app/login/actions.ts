"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

type SignInResult = {
  error?: string;
  redirectTo?: string;
};

export async function signInWithCredentials(
  formData: FormData,
): Promise<SignInResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = (formData.get("callbackUrl") as string | null) ?? "/dashboard";

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Ungültige Eingabe." };
  }

  try {
    await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });
    return { redirectTo: callbackUrl };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "E-Mail oder Passwort ist falsch." };
      }
      return { error: "Anmeldung fehlgeschlagen." };
    }
    throw error;
  }
}
