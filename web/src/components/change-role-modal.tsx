import { X, Shield, Loader2, ChevronDown, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: "member" | "admin" | "owner";
  onConfirm: (role: "member" | "admin" | "owner") => void;
  isPending: boolean;
}

export function ChangeRoleModal({
  isOpen,
  onClose,
  currentRole,
  onConfirm,
  isPending,
}: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<
    "member" | "admin" | "owner"
  >(currentRole);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  const roles = [
    {
      value: "member",
      label: "Member",
      description:
        "Can view and manage resources but cannot manage billing or members.",
    },
    {
      value: "admin",
      label: "Admin",
      description: "Can manage all resources, billing, and members.",
    },
    {
      value: "owner",
      label: "Owner",
      description:
        "Full access to everything including deleting the organization.",
    },
  ] as const;

  const selectedRoleData = roles.find((r) => r.value === selectedRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#101010] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Change Member Role</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Select Role
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl py-2.5 pl-3 pr-4 text-white hover:bg-white/10 transition-all ${isDropdownOpen ? "border-white/20 bg-white/10" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="text-gray-500" size={18} />
                  <span className="capitalize">{selectedRole}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#101010] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="max-h-60 overflow-y-auto">
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.value);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left group border-b border-white/5 last:border-0"
                      >
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {role.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-400">
                            {role.description}
                          </div>
                        </div>
                        {selectedRole === role.value && (
                          <Check size={16} className="text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {selectedRoleData?.description}
            </p>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedRole)}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
