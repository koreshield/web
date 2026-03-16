import { User, Mail, Shield, Building, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../lib/auth';

export function ProfilePage() {
	const user = authService.getCurrentUser();

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<p className="text-muted-foreground">Please log in to view your profile.</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<User className="w-6 h-6 text-primary" />
						</div>
						<div>
							<h1 className="text-2xl font-bold">User Profile</h1>
							<p className="text-sm text-muted-foreground">
								Manage your account settings and preferences
							</p>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-card border border-border rounded-lg shadow-sm">
					<div className="p-6 border-b border-border">
						<h2 className="text-lg font-semibold">Personal Information</h2>
						<p className="text-sm text-muted-foreground">
							Basic details about your account.
						</p>
					</div>
					<div className="p-6 space-y-6">
						<div className="grid gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<User className="w-4 h-4" /> Full Name
								</label>
								<div className="p-3 bg-muted rounded-md text-foreground font-medium">
									{user.name}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Mail className="w-4 h-4" /> Email Address
								</label>
								<div className="p-3 bg-muted rounded-md text-foreground font-medium">
									{user.email}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Shield className="w-4 h-4" /> Role
								</label>
								<div className="p-3 bg-muted rounded-md text-foreground font-medium capitalize">
									{user.role}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Building className="w-4 h-4" /> Account Status
								</label>
								<div className="flex items-center gap-2 p-3 bg-muted rounded-md text-foreground font-medium capitalize">
									<span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
									{user.status || 'unknown'}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 bg-card border border-border rounded-lg shadow-sm p-6">
					<div className="flex items-start justify-between gap-4 flex-wrap">
						<div>
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<CreditCard className="w-5 h-5 text-primary" />
								Billing
							</h2>
							<p className="text-sm text-muted-foreground mt-1">
								Manage your subscription, invoices, and Polar customer portal access.
							</p>
						</div>
						<Link
							to="/billing"
							className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
						>
							Open billing
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
