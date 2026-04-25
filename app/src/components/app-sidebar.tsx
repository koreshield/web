import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Shield,
  Settings,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  CreditCard,
  Users,
  Key,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { authClient, usePermission } from "@/lib/auth-client";
import { NavItem } from "./sidebar/nav-item";
import { OrganizationDropdown } from "./sidebar/organization-dropdown";
import { UserSection } from "./sidebar/user-section";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { setSelectedOrganization } = useAppStore();
  const { data: organizations = [] } = authClient.useListOrganizations();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const { orgSlug } = useParams({ from: "/app/$orgSlug" });

  const selectedOrg =
    organizations?.find((org) => org.slug === orgSlug) || organizations?.[0];

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const { data: canManageBilling } = usePermission({
    billing: ["manage"],
  });

  const NAV_ICON_SIZE = 14;

  const navItems = [
    {
      to: "/app/$orgSlug",
      label: "Overview",
      icon: <LayoutDashboard size={NAV_ICON_SIZE} />,
      activeOptions: { exact: true },
    },
    {
      to: "/app/$orgSlug/install",
      label: "Install",
      icon: <Shield size={NAV_ICON_SIZE} />,
    },
    {
      to: "/app/$orgSlug/firewall",
      label: "Firewall",
      icon: <Shield size={NAV_ICON_SIZE} />,
    },
    {
      to: "/app/$orgSlug/requests",
      label: "Requests",
      icon: <History size={NAV_ICON_SIZE} />,
    },
    canManageBilling && {
      to: "/app/$orgSlug/billing",
      label: "Billing",
      icon: <CreditCard size={NAV_ICON_SIZE} />,
    },
    {
      to: "/app/$orgSlug/members",
      label: "Members",
      icon: <Users size={NAV_ICON_SIZE} />,
    },
    {
      to: "/app/$orgSlug/tokens",
      label: "API Tokens",
      icon: <Key size={NAV_ICON_SIZE} />,
    },
    {
      to: "/app/$orgSlug/settings",
      label: "Settings",
      icon: <Settings size={NAV_ICON_SIZE} />,
    },
  ].filter((item) => item !== false && item !== undefined) as any[];

  return (
    <div
      className={`${isCollapsed ? "w-15" : "w-56"} h-full flex flex-col motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-in-out motion-reduce:transition-none bg-[#050a14] border-r border-white/5 overflow-hidden`}
    >
      <div
        className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-2">
            <img src="/logo-padlock.png" alt="KoreShield Logo" className="w-8" />
            <p className="font-bold text-white text-lg tracking-tight">
              KoreShield
            </p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      <OrganizationDropdown
        organizations={organizations!}
        setSelectedOrganization={setSelectedOrganization}
        isOrgDropdownOpen={isOrgDropdownOpen}
        setIsOrgDropdownOpen={setIsOrgDropdownOpen}
        isCollapsed={isCollapsed}
      />

      <div className="flex-1 px-2 py-4 space-y-0.5 overflow-x-hidden overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            activeOptions={item.activeOptions}
            isCollapsed={isCollapsed}
            params={{ orgSlug: selectedOrg?.slug ?? orgSlug ?? "" }}
          />
        ))}
      </div>

      <UserSection user={user} isCollapsed={isCollapsed} />
    </div>
  );
}
