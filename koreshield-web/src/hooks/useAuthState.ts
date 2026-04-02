import { useEffect, useState } from 'react';
import { authService, type AuthUser } from '../lib/auth';

type AuthState = {
	isAuthenticated: boolean;
	user: AuthUser | null;
	isHydrating: boolean;
};

function readState(): Omit<AuthState, 'isHydrating'> {
	return {
		isAuthenticated: authService.isAuthenticated(),
		user: authService.getCurrentUser(),
	};
}

export function useAuthState(): AuthState {
	const [state, setState] = useState<AuthState>(() => ({
		...readState(),
		isHydrating: !authService.isAuthenticated(),
	}));

	useEffect(() => {
		let active = true;

		const syncState = () => {
			if (!active) {
				return;
			}
			setState({
				...readState(),
				isHydrating: false,
			});
		};

		authService.on('login', syncState);
		authService.on('logout', syncState);

		if (!authService.isAuthenticated()) {
			void authService.restoreSession().finally(syncState);
		} else {
			syncState();
		}

		return () => {
			active = false;
			authService.off('login', syncState);
			authService.off('logout', syncState);
		};
	}, []);

	return state;
}
