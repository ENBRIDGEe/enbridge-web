import { Link } from "react-router-dom";
import type { UserProfile } from "../../lib/api";

type SidebarProps = {
	user: UserProfile | null;
	isLoading: boolean;
	displayName: string;
	liveTaskCount: number;
	isTasksLoading: boolean;
	signOut: () => void;
};

const navItems = [
	["Dashboard", "/app/dashboard"],
	["Tasks", "/app/tasks"],
	["Habits", "/app/habits"],
	["Focus", "/app/focus"],
	["Analytics", "/app/analytics"],
	["Settings", "/app/settings"],
];

export function Sidebar({
	user,
	isLoading,
	displayName,
	liveTaskCount,
	isTasksLoading,
	signOut,
}: SidebarProps) {
	return (
		<aside className="glass-panel rounded-[2rem] p-5 flex flex-col xl:sticky xl:top-8 xl:min-h-[calc(100vh-4rem)]">
			<p className="section-label">Enbridge</p>
			<nav className="mt-6 space-y-2 text-sm">
				{navItems.map(([label, href]) => (
					<Link
						key={href}
						to={href}
						className="block rounded-2xl px-4 py-3 text-smoke transition hover:bg-white/5 hover:text-pearl"
					>
						{label}
					</Link>
				))}
			</nav>

			<div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 w-full xl:fixed xl:left-8 xl:bottom-8 xl:w-56 xl:mt-0">
				<p className="text-xs uppercase tracking-[0.3em] text-smoke">
					Profile
				</p>
				<div className="mt-3 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 text-sm font-medium text-pearl">
						{isLoading
							? "..."
							: (displayName.charAt(0) || "?").toUpperCase()}
					</div>
					<div>
						<p className="text-sm text-pearl">
							{isLoading ? "Loading..." : displayName}
						</p>
						<p className="text-xs text-smoke">
							{isLoading
								? ""
								: user?.email || "College + gym + assignments"}
						</p>
					</div>
				</div>
				<div className="mt-4 flex items-center justify-between gap-3">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-smoke">
							Live tasks
						</p>
						<p className="mt-2 text-2xl font-medium text-pearl">
							{isTasksLoading ? "..." : liveTaskCount}
						</p>
					</div>
					<button
						type="button"
						onClick={signOut}
						className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.28em] text-smoke transition hover:border-white/20 hover:bg-white/10"
					>
						Log out
					</button>
				</div>
			</div>
		</aside>
	);
}
