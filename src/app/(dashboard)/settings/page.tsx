import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Einstellungen",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-[var(--color-muted)]">{description}</p>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, email: true },
  });
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>

      <Section title="Profil" description="Ihr Anzeigename und Ihre E-Mail.">
        <ProfileForm displayName={user.displayName} email={user.email} />
      </Section>

      <Section
        title="Passwort ändern"
        description="Wählen Sie ein neues Passwort mit mindestens 8 Zeichen."
      >
        <PasswordForm />
      </Section>

      <Section
        title="Darstellung"
        description="Wechseln Sie zwischen hellem und dunklem Design."
      >
        <ThemeToggle />
      </Section>
    </div>
  );
}
