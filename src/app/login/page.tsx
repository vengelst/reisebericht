import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";
  const hasError = Boolean(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight"
          >
            <span className="inline-block h-3 w-3 rounded-full bg-[var(--color-accent)]" />
            Reisebericht
          </Link>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Melden Sie sich an, um Ihre Reisen zu verwalten.
          </p>
        </div>

        <LoginForm callbackUrl={callbackUrl} initialError={hasError} />
      </div>
    </main>
  );
}
