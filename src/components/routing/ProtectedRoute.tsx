import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../lib/api";

export function ProtectedRoute({ children }: { children: ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();
	const [isDelayed, setIsDelayed] = useState(false);

	useEffect(() => {
		if (!isLoading) return;
		const timer = setTimeout(() => setIsDelayed(true), 3000);
		return () => clearTimeout(timer);
	}, [isLoading]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-ink text-pearl">
				<div className="text-center">
					<div className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-smoke mb-4">
						Loading your workspace...
					</div>
					{isDelayed && (
						<p className="text-xs text-smoke/60">
							This is taking longer than usual. Make sure your API
							is reachable at {API_BASE_URL}.
						</p>
					)}
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <>{children}</>;
}
