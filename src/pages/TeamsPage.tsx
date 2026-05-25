import { useState } from 'react';
import { Users, Plus, ArrowRight, Clock } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import { format } from 'date-fns';
import {
	AppPage,
	AppPageHeader,
	AppStatGrid,
	AppStatCard,
	AppEmptyState,
	AppPrimaryButton,
	AppSecondaryButton,
	AppPageError,
} from '../components/AppPageLayout';

interface Team {
	id: string;
	name: string;
	slug: string;
	created_at: string;
	my_role: string;
	owner_id: string;
}

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
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
	const { data: teams = [], isLoading, isError, error: teamsError, refetch } = useQuery<Team[]>({
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
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to create team'));
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
		<>
			<SEOMeta title="Teams" noindex />
			<AppPage>
				<AppPageHeader
					eyebrow="Collaboration"
					eyebrowIcon={Users}
					title="Teams"
					description="Manage your teams and collaborate with others"
					icon={Users}
					actions={
						<AppPrimaryButton onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
							<Plus className="w-4 h-4" />
							Create Team
						</AppPrimaryButton>
					}
				/>

				{!isLoading && !isError && teams.length > 0 && (
					<AppStatGrid columns={2}>
						<AppStatCard label="Total Teams" value={teams.length} icon={Users} />
						<AppStatCard
							label="Owned"
							value={teams.filter((team) => team.my_role === 'owner').length}
							icon={Users}
							tone="text-violet-400"
						/>
					</AppStatGrid>
				)}

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
					</div>
				) : isError ? (
					<AppPageError
						message={getErrorMessage(teamsError, 'Unable to reach the Koreshield API.')}
						onRetry={() => refetch()}
					/>
				) : teams.length === 0 ? (
					<AppEmptyState
						icon={Users}
						title="No Teams Yet"
						description="Create your first team to start collaborating."
						action={
							<AppPrimaryButton onClick={() => setShowCreateModal(true)}>
								<Plus className="w-4 h-4" />
								Create Team
							</AppPrimaryButton>
						}
					/>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
						{teams.map((team) => (
							<Link
								key={team.id}
								to={`/teams/${team.id}`}
								className="dashboard-card group block rounded-2xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
										<Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									</div>
									<span className={`px-2 py-1 rounded text-xs font-medium ${team.my_role === 'owner' ? 'bg-purple-500/10 text-purple-400' :
										team.my_role === 'admin' ? 'bg-blue-500/10 text-blue-400' :
											'bg-muted text-muted-foreground'
										}`}>
										{team.my_role.toUpperCase()}
									</span>
								</div>
								<h3 className="text-xl font-black tracking-[-0.03em] mb-1 group-hover:text-primary transition-colors">
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
			</AppPage>

			{showCreateModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="dashboard-modal bg-card border border-border rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl">
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
								<AppSecondaryButton
									onClick={() => {
										setShowCreateModal(false);
										setFormData({ name: '', slug: '' });
									}}
									className="flex-1"
									disabled={createTeamMutation.isPending}
								>
									Cancel
								</AppSecondaryButton>
								<AppPrimaryButton
									onClick={handleCreateTeam}
									disabled={!formData.name || !formData.slug || createTeamMutation.isPending}
									className="flex-1"
								>
									{createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
								</AppPrimaryButton>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
