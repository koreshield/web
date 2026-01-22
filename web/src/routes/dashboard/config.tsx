
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { koreshieldApi, SecurityConfig } from "@/lib/api-client";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/dashboard/config")({
    component: DashboardConfig,
});

function DashboardConfig() {
    const queryClient = useQueryClient();
    const { data: config, isLoading } = useQuery({
        queryKey: ["koreshield-config"],
        queryFn: koreshieldApi.getConfig,
    });

    const [localConfig, setLocalConfig] = useState<Partial<SecurityConfig>>({});

    // Sync local state when config loads
    useEffect(() => {
        if (config?.security) {
            setLocalConfig(config.security);
        }
    }, [config]);

    const mutation = useMutation({
        mutationFn: koreshieldApi.updateSecurityConfig,
        onSuccess: () => {
            toast.success("Configuration updated successfully");
            queryClient.invalidateQueries({ queryKey: ["koreshield-config"] });
        },
        onError: () => {
            toast.error("Failed to update configuration");
        },
    });

    const handleSave = () => {
        mutation.mutate(localConfig);
    };

    if (isLoading) return <div>Loading config...</div>;

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Configuration</h2>
                    <p className="text-gray-500">Manage security policies and engine sensitivity.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={mutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {mutation.isPending ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="space-y-6">
                {/* Sensitivity Card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Detection Sensitivity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {["low", "medium", "high"].map((level) => (
                            <div
                                key={level}
                                onClick={() => setLocalConfig({ ...localConfig, sensitivity: level as any })}
                                className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${localConfig.sensitivity === level
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                                    }`}
                            >
                                <div className="capitalize font-bold mb-1">{level}</div>
                                <div className="text-sm text-gray-500">
                                    {level === "low" && "Fewer false positives, allows more traffic."}
                                    {level === "medium" && "Balanced protection."}
                                    {level === "high" && "Maximum security, strictly blocks suspicious inputs."}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Default Action Card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Default Action</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="flex-1">
                                <div className="font-medium">Block</div>
                                <div className="text-sm text-gray-500">Stop request and return 403 Forbidden.</div>
                            </label>
                            <input
                                type="radio"
                                name="action"
                                checked={localConfig.default_action === "block"}
                                onChange={() => setLocalConfig({ ...localConfig, default_action: "block" })}
                                className="h-5 w-5 text-blue-600"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex-1">
                                <div className="font-medium">Flag/Log Only</div>
                                <div className="text-sm text-gray-500">Allow request but log as attack. Good for testing.</div>
                            </label>
                            <input
                                type="radio"
                                name="action"
                                checked={localConfig.default_action === "flag"}
                                onChange={() => setLocalConfig({ ...localConfig, default_action: "flag" })}
                                className="h-5 w-5 text-blue-600"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
