export function OverviewHeader() {
  return (
    <div className="flex items-start sm:items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Overview
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Welcome back, here's what's happening.
        </p>
      </div>
    </div>
  );
}
