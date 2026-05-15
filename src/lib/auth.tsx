import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { clearAccessToken, fetchCurrentUser, type UserProfile } from "./api";

type AuthContextValue = {
	user: UserProfile | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	refreshUser: () => Promise<void>;
	signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	async function refreshUser() {
		try {
			setIsLoading(true);
			const profile = await fetchCurrentUser();
			setUser(profile);
		} catch {
			clearAccessToken();
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	}

	function signOut() {
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
