import { useMemo } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../lib/auth";
import type { ReactNode } from "react";

type AppLayoutProps = {
	children: ReactNode;
	liveTaskCount?: number;
	isTasksLoading?: boolean;
};

function formatDisplayName(
	user: {
		name?: string;
		username?: string;
		display_name?: string;
		full_name?: string;
		first_name?: string;
		last_name?: string;
		email?: string;
	} | null,
) {
	if (!user) {
		return "Student";
	}

	const directName =
		user.name?.trim() ||
		user.display_name?.trim() ||
		user.full_name?.trim() ||
		user.username?.trim();

	if (directName) {
		return directName;
	}

	const combinedName = [user.first_name, user.last_name]
		.filter(Boolean)
		.map((value) => value?.trim())
		.join(" ")
		.trim();

	if (combinedName) {
		return combinedName;
	}

	if (user.email) {
		const emailName = user.email
			.split("@")[0]
			.replace(/[._-]+/g, " ")
			.replace(/\b\w/g, (character) => character.toUpperCase())
			.trim();

		if (emailName) {
			return emailName;
		}
	}

	return "Student";
}

export function AppLayout({
	children,
	liveTaskCount = 0,
	isTasksLoading = false,
}: AppLayoutProps) {
	const { user, isLoading, signOut } = useAuth();
	const displayName = formatDisplayName(user);

	return (
		<main className="page-shell max-w-full px-6 lg:px-8 py-6 lg:py-8 overflow-x-hidden">
			<Sidebar
				user={user}
				isLoading={isLoading}
				displayName={displayName}
				liveTaskCount={liveTaskCount}
				isTasksLoading={isTasksLoading}
				signOut={signOut}
			/>
			<div className="w-full max-w-full box-border grid gap-6 xl:ml-[264px] pr-6 xl:max-w-[calc(100vw-320px)]">
				{children}
			</div>
		</main>
	);
}
