export default function AppLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading your workspace">
      <p className="text-sm font-semibold text-muted">Loading your workspace…</p>
      <div className="mt-4 h-10 max-w-xl animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-3 h-5 max-w-2xl animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="h-40 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
        <div className="h-40 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
        <div className="h-40 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}
