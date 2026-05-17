import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	clearAccessToken,
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
				await refreshToken();
				console.log("[Auth] Token refreshed successfully");
			} catch (error) {
				// Cookie refresh can fail for new visitors; the user fetch below is authoritative.
				console.debug("[Auth] Token refresh skipped:", error);
			}
			console.log("[Auth] Fetching current user...");
			const profile = await fetchCurrentUser();
			setUser(profile);
			console.log("[Auth] User authenticated:", profile?.email);
			return profile;
		} catch (error) {
			console.error("[Auth] Failed to load user:", error);
			clearAccessToken();
			setUser(null);
			return null;
		} finally {
			setIsLoading(false);
		}
	}

	function signOut() {
		void logout();
		clearAccessToken();
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
