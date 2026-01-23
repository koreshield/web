import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Shield,
  LogOut,
  BarChart3,
  X,
} from "lucide-react";
import { useEffect } from "react";

interface AdminSidebarProps {
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/organizations", label: "Organizations", icon: Building2 },
  { path: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { path: "/admin/security", label: "Security Events", icon: Shield },
  { path: "/admin/charts", label: "Charts", icon: BarChart3 },
];

export function AdminSidebar({ onLogout, isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A] border-r border-white/5">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="KoreShield" className="w-8 h-8" />
          <div>
            <span className="font-bold text-white text-lg">KoreShield</span>
            <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <Icon size={18} className={active ? "text-accent" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-30">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
          role="button"
          aria-label="Close sidebar"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-[#0A0A0A] z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <SidebarContent />
      </div>
    </>
  );
}
