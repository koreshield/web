import { useState } from 'react';
import { Users, Plus, ArrowRight, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import { format } from 'date-fns';

interface Team {
	id: string;
	name: string;
	slug: string;
	created_at: string;
	my_role: string;
	owner_id: string;
}

export function TeamsPage() {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		slug: ''
	});
	const { success, error } = useToast();
	const queryClient = useQueryClient();

	// Fetch Teams
	const { data: teams = [], isLoading } = useQuery<Team[]>({
		queryKey: ['teams'],
		queryFn: () => api.getTeams() as Promise<Team[]>,
	});

	// Create Team Mutation
	const createTeamMutation = useMutation({
		mutationFn: (data: { name: string; slug: string }) => api.createTeam(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['teams'] });
			setShowCreateModal(false);
			setFormData({ name: '', slug: '' });
			success('Team created successfully!');
		},
		onError: (err: any) => {
			error(err.message || 'Failed to create team');
		},
	});

	const handleCreateTeam = () => {
		if (!formData.name || !formData.slug) return;
		createTeamMutation.mutate(formData);
	};

	// Auto-generate slug from name if slug is empty
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;
		const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
		setFormData(prev => ({
			...prev,
			name,
			slug: prev.slug === '' || prev.slug === slug.substring(0, slug.length - 1) ? slug : prev.slug
		}));
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-primary/10 rounded-lg">
								<Users className="w-6 h-6 text-primary" />
							</div>
							<div>
								<h1 className="text-2xl font-bold">Teams</h1>
								<p className="text-sm text-muted-foreground">
									Manage your teams and collaborate with others
								</p>
							</div>
						</div>
						<button
							onClick={() => setShowCreateModal(true)}
							className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
						>
							<Plus className="w-4 h-4" />
							<span>Create Team</span>
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
					</div>
				) : teams.length === 0 ? (
					<div className="bg-card border border-border rounded-lg p-12 text-center">
						<Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
						<h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
						<p className="text-muted-foreground mb-6">
							Create your first team to start collaborating.
						</p>
						<button
							onClick={() => setShowCreateModal(true)}
							className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
						>
							<Plus className="w-4 h-4" />
							Create Team
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{teams.map((team) => (
							<Link
								key={team.id}
								to={`/teams/${team.id}`}
								className="group block bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
										<Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									</div>
									<span className={`px-2 py-1 rounded text-xs font-medium ${team.my_role === 'owner' ? 'bg-purple-500/10 text-purple-400' :
										team.my_role === 'admin' ? 'bg-blue-500/10 text-blue-400' :
											'bg-gray-500/10 text-gray-400'
										}`}>
										{team.my_role.toUpperCase()}
									</span>
								</div>
								<h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
									{team.name}
								</h3>
								<p className="text-sm text-muted-foreground mb-4">
									/{team.slug}
								</p>
								<div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
									<div className="flex items-center gap-1">
										<Clock className="w-4 h-4" />
										<span>{format(new Date(team.created_at), 'MMM d, yyyy')}</span>
									</div>
									<div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
										<span>Manage</span>
										<ArrowRight className="w-4 h-4" />
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</main>

			{/* Create Team Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl">
						<h2 className="text-xl font-bold mb-4">Create New Team</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">
									Team Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Acme Corp"
									value={formData.name}
									onChange={handleNameChange}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									autoFocus
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">
									Team Slug <span className="text-red-500">*</span>
								</label>
								<div className="flex items-center">
									<span className="bg-muted border border-r-0 border-border rounded-l-lg px-3 py-2 text-muted-foreground text-sm">
										/teams/
									</span>
									<input
										type="text"
										placeholder="acme-corp"
										value={formData.slug}
										onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
										className="w-full px-3 py-2 bg-muted border border-border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Unique identifier for your team URL. Only lowercase letters, numbers, and hyphens.
								</p>
							</div>

							<div className="flex gap-3 mt-6">
								<button
									onClick={() => {
										setShowCreateModal(false);
										setFormData({ name: '', slug: '' });
									}}
									className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
									disabled={createTeamMutation.isPending}
								>
									Cancel
								</button>
								<button
									onClick={handleCreateTeam}
									disabled={!formData.name || !formData.slug || createTeamMutation.isPending}
									className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}


