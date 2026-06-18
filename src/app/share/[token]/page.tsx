type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      <span className="mb-4 inline-block h-3 w-3 rounded-full bg-[var(--color-accent)]" />
      <h1 className="text-2xl font-semibold tracking-tight">Reisebericht</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--color-muted)]">
        Der öffentliche Bericht für Token <code className="font-mono">{token}</code> ist
        noch nicht implementiert. Sobald eine Reise freigegeben ist, erscheint hier
        der Bericht.
      </p>
    </main>
  );
}
