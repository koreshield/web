import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { koreshieldApi, Policy } from "@/lib/api-client";
import { useState } from "react";
import {
  Plus,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

export const Route = createFileRoute("/dashboard/policies")({
  component: Policies,
});

function Policies() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: policies, isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: koreshieldApi.getPolicies,
  });

  const createMutation = useMutation({
    mutationFn: koreshieldApi.createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      setIsCreateOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: koreshieldApi.deletePolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this policy?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Policies</h2>
          <p className="text-gray-500">Manage access control and threat detection rules.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Policy
        </button>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-4">Create New Policy</h3>
            <CreatePolicyForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setIsCreateOpen(false)}
              isPending={createMutation.isPending}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : policies?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            No policies found. Create one to get started.
          </div>
        ) : (
          policies?.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onDelete={() => handleDelete(policy.id)}
              isDeleting={deleteMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PolicyCard({ policy, onDelete, isDeleting }: { policy: Policy; onDelete: () => void; isDeleting: boolean }) {
  const severityColors = {
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    medium: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    critical: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  const severityColor = severityColors[policy.severity as keyof typeof severityColors] || severityColors.low;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
      <div className="flex justify-between items-start mb-3">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${severityColor}`}>
          {policy.severity}
        </div>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="text-gray-400 hover:text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Policy"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <h3 className="font-bold text-lg mb-1">{policy.name}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{policy.description}</p>

      <div className="flex flex-wrap gap-2 mt-auto">
        {policy.roles.map((role) => (
          <span key={role} className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-600 dark:text-gray-400">
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}

function CreatePolicyForm({ onSubmit, onCancel, isPending }: { onSubmit: (data: Policy) => void; onCancel: () => void; isPending: boolean }) {
  const [formData, setFormData] = useState<Partial<Policy>>({
    name: "",
    description: "",
    severity: "medium",
    roles: [],
  });

  const [rolesInput, setRolesInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roles = rolesInput.split(",").map(r => r.trim()).filter(Boolean);
    onSubmit({
      id: crypto.randomUUID(),
      name: formData.name!,
      description: formData.description!,
      severity: formData.severity!,
      roles: roles.length > 0 ? roles : ["*"],
    } as Policy);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Policy Name</label>
        <input
          required
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Block PII Leaks"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          required
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What does this policy do?"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Severity</label>
          <select
            value={formData.severity}
            onChange={e => setFormData({ ...formData, severity: e.target.value })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Roles (comma-separated)</label>
          <input
            type="text"
            value={rolesInput}
            onChange={e => setRolesInput(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin, user, *"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Policy
        </button>
      </div>
    </form>
  );
}
