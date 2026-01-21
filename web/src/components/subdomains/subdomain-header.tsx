import { Plus } from "lucide-react";

interface SubdomainHeaderProps {
  currentSubdomainCount: number;
  subdomainLimit: number;
  isUnlimited: boolean;
  isAtLimit: boolean;
  onAddClick: () => void;
}

export function SubdomainHeader({
  currentSubdomainCount,
  subdomainLimit,
  isUnlimited,
  isAtLimit,
  onAddClick,
}: SubdomainHeaderProps) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-white">
          Subdomains
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Reserve subdomains for your tunnels · {currentSubdomainCount} /{" "}
          {isUnlimited ? "∞" : subdomainLimit} subdomains
        </p>
      </div>
      <button
        onClick={onAddClick}
        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-white/5 shrink-0 ${
          isAtLimit
            ? "bg-white/10 text-gray-400 cursor-not-allowed"
            : "bg-white hover:bg-gray-200 text-black"
        }`}
      >
        <Plus size={18} />
        <span className="hidden sm:inline">Reserve Subdomain</span>
      </button>
    </div>
  );
}
