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
		// Start as false so Sign In / Dashboard buttons render immediately on
		// every device. restoreSession runs in the background and updates state
		// if a valid cookie session is found.
		isHydrating: false,
	}));

	useEffect(() => {
		let active = true;

		const syncState = () => {
			if (!active) return;
			setState({ ...readState(), isHydrating: false });
		};

		authService.on('login', syncState);
		authService.on('logout', syncState);

		if (!authService.isAuthenticated()) {
			// Hard cap: never hide nav buttons for more than 800ms on any connection
			const timeout = setTimeout(() => {
				if (active) setState(s => ({ ...s, isHydrating: false }));
			}, 800);

			void authService.restoreSession().finally(() => {
				clearTimeout(timeout);
				syncState();
			});

			return () => {
				active = false;
				clearTimeout(timeout);
				authService.off('login', syncState);
				authService.off('logout', syncState);
			};
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
