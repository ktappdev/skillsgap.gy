export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-10 w-3/4 max-w-xl animate-pulse rounded-xl bg-surface-muted" />
      <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded-lg bg-surface-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-96 animate-pulse rounded-3xl bg-surface-muted" />
        <div className="h-72 animate-pulse rounded-3xl bg-surface-muted" />
      </div>
    </div>
  );
}
