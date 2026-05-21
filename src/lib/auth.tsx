import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	clearAllTokens,
	fetchCurrentUser,
	logout,
	refreshToken,
	type UserProfile,
} from "./api";

type AuthContextValue = {
	user: UserProfile | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	refreshUser: () => Promise<UserProfile | null>;
	signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	async function refreshUser() {
		try {
			setIsLoading(true);
			console.log("[Auth] Refreshing user session...");
			try {
				// Try fetching the current user first (access token may be present)
				const profile = await fetchCurrentUser();
				setUser(profile);
				console.log("[Auth] User authenticated:", profile?.email);
				return profile;
			} catch (err) {
				// If fetching user failed, try to refresh tokens then fetch again
				console.debug("[Auth] fetchCurrentUser failed, attempting token refresh", err);
				try {
					await refreshToken();
				} catch (refreshErr) {
					console.debug("[Auth] Token refresh failed:", refreshErr);
					throw refreshErr;
				}
				const profile = await fetchCurrentUser();
				setUser(profile);
				console.log("[Auth] User authenticated:", profile?.email);
				return profile;
			}
		} catch (error) {
			console.error("[Auth] Failed to load user:", error);
			clearAllTokens();
			setUser(null);
			return null;
		} finally {
			setIsLoading(false);
		}
	}

	function signOut() {
		void logout();
		clearAllTokens();
		setUser(null);
	}

	useEffect(() => {
		void refreshUser();
	}, []);

	const value = useMemo(
		() => ({
			user,
			isAuthenticated: Boolean(user),
			isLoading,
			refreshUser,
			signOut,
		}),
		[user, isLoading],
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}

	return context;
}
