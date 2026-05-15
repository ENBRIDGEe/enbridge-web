import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MetricCard } from "../components/dashboard/MetricCard";
import { ProgressRing } from "../components/dashboard/ProgressRing";
import { QuickActionCard } from "../components/dashboard/QuickActionCard";
import { TimelineItem } from "../components/dashboard/TimelineItem";
import { useAuth } from "../lib/auth";
import { apiRequest } from "../lib/api";
import type { TaskRecord } from "../lib/taskTypes";
import {
	dashboardMetrics,
	habitItems,
	quickActions,
	reviewItems,
	timelineTasks,
} from "../data/dashboardData";

const navItems = [
	["Dashboard", "/app/dashboard"],
	["Tasks", "/app/tasks"],
	["Habits", "/app/habits"],
	["Focus", "/app/focus"],
	["Analytics", "/app/analytics"],
	["Settings", "/app/settings"],
];

type DisplayTask = {
	time: string;
	title: string;
	category: string;
	status: "completed" | "in-progress" | "pending" | "missed";
};

function normalizeTask(task: TaskRecord, index: number): DisplayTask {
	const time = task.due_date
		? new Date(task.due_date).toLocaleTimeString([], {
				hour: "numeric",
				minute: "2-digit",
			})
		: `Task ${index + 1}`;

	return {
		time,
		title: task.title || task.task_name || task.name || `Task ${index + 1}`,
		category: task.category || "Task",
		status:
			task.completed || task.status === "completed"
				? "completed"
				: task.status === "in-progress"
					? "in-progress"
					: "pending",
	};
}

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

function getTimeBasedGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) {
		return "Good morning";
	} else if (hour < 17) {
		return "Good afternoon";
	} else {
		return "Good evening";
	}
}

export function DashboardPage() {
	const { user, signOut, isLoading, refreshUser } = useAuth();
	const [tasks, setTasks] = useState<TaskRecord[]>([]);
	const [isTasksLoading, setIsTasksLoading] = useState(true);
	const [tasksError, setTasksError] = useState("");

	useEffect(() => {
		let isMounted = true;

		async function loadTasks() {
			try {
				setIsTasksLoading(true);
				setTasksError("");
				const response = await apiRequest<TaskRecord[]>("/tasks", {
					method: "GET",
					auth: true,
				});

				if (isMounted) {
					setTasks(Array.isArray(response) ? response : []);
				}
			} catch (error) {
				if (isMounted) {
					setTasks([]);
					setTasksError(
						error instanceof Error
							? error.message
							: "Unable to load tasks.",
					);
				}
			} finally {
				if (isMounted) {
					setIsTasksLoading(false);
				}
			}
		}

		void loadTasks();

		return () => {
			isMounted = false;
		};
	}, []);

	const liveTaskCount = useMemo(() => tasks.length, [tasks]);
	const completedTaskCount = useMemo(
		() =>
			tasks.filter(
				(task) => task.completed || task.status === "completed",
			).length,
		[tasks],
	);
	const displayName = formatDisplayName(user);

	const liveProgress =
		liveTaskCount > 0
			? Math.round((completedTaskCount / liveTaskCount) * 100)
			: 0;
	const displayedTasks: DisplayTask[] =
		liveTaskCount > 0
			? tasks.slice(0, 6).map(normalizeTask)
			: timelineTasks;

	return (
		<main className="page-shell max-w-full px-6 lg:px-8 py-6 lg:py-8">
			<div className="w-full grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
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
									: (
											displayName.charAt(0) || "?"
										).toUpperCase()}
							</div>
							<div>
								<p className="text-sm text-pearl">
									{isLoading ? "Loading..." : displayName}
								</p>
								<p className="text-xs text-smoke">
									{isLoading
										? ""
										: user?.email ||
											"College + gym + assignments"}
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

				<section className="space-y-6">
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
						<div className="glass-panel rounded-[2rem] p-8">
							<p className="section-label">
								{getTimeBasedGreeting()}
							</p>
							<div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
								<div>
									<h1 className="font-display text-5xl leading-[0.96] text-pearl sm:text-6xl">
										{displayName}.
									</h1>
									<p className="mt-4 max-w-2xl text-smoke sm:text-lg">
										Your day is already in motion. This is
										the central command for tasks, habits,
										focus, reminders, and review.
									</p>
								</div>

								{/* profile moved to sidebar for fixed placement */}
							</div>
						</div>

						<ProgressRing
							value={liveProgress}
							label={`${liveProgress}%`}
							subtitle={
								isTasksLoading
									? "Loading live task data from the backend."
									: `${completedTaskCount} tasks completed, ${Math.max(liveTaskCount - completedTaskCount, 0)} still pending, and momentum is holding steady.`
							}
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						{dashboardMetrics.map((metric) => (
							<MetricCard
								key={metric.label}
								label={metric.label}
								value={metric.value}
								detail={metric.detail}
							/>
						))}
					</div>

					<div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
						<div className="glass-panel rounded-[2rem] p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="section-label">Timeline</p>
									<h2 className="mt-3 font-display text-4xl text-pearl">
										Today’s schedule
									</h2>
								</div>
								<div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.3em] text-smoke">
									Live
								</div>
							</div>

							{tasksError ? (
								<div className="mt-5 rounded-[1.5rem] border border-amber/20 bg-amber/10 p-4 text-sm text-pearl">
									{tasksError}
								</div>
							) : null}

							<div className="mt-6 space-y-3">
								{displayedTasks.map((task) => (
									<TimelineItem
										key={`${task.time}-${task.title}`}
										task={task}
									/>
								))}
							</div>
						</div>

						<div className="space-y-6">
							<div className="glass-panel rounded-[2rem] p-6">
								<p className="section-label">Quick actions</p>
								<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
									{quickActions.map((action) => (
										<QuickActionCard
											key={action.label}
											action={action}
										/>
									))}
								</div>
							</div>

							<div className="glass-panel rounded-[2rem] p-6">
								<p className="section-label">Focus mode</p>
								<div className="mt-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm uppercase tracking-[0.3em] text-smoke">
												Pomodoro
											</p>
											<p className="mt-3 font-display text-5xl text-pearl">
												25:00
											</p>
										</div>
										<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-smoke">
											4 sessions today
										</div>
									</div>
									<div className="mt-4 h-2 rounded-full bg-white/10">
										<div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-glow via-white to-amber" />
									</div>
									<p className="mt-4 text-sm leading-6 text-smoke">
										Minimal focus mode, soft sound, and a
										clean completion state for deep work.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
						<div className="glass-panel rounded-[2rem] p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="section-label">
										Habit streaks
									</p>
									<h2 className="mt-3 font-display text-4xl text-pearl">
										Build the loop.
									</h2>
								</div>
								<div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.3em] text-smoke">
									MVP
								</div>
							</div>

							<div className="mt-6 grid gap-4 lg:grid-cols-3">
								{habitItems.map((habit) => (
									<article
										key={habit.name}
										className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5"
									>
										<div className="flex items-center justify-between gap-4">
											<div>
												<p className="text-base text-pearl">
													{habit.name}
												</p>
												<p className="mt-1 text-sm text-smoke">
													{habit.streak}-day streak
												</p>
											</div>
											<p className="text-lg font-medium text-pearl">
												{habit.progress}%
											</p>
										</div>
										<div className="mt-4 h-2 rounded-full bg-white/10">
											<div
												className="h-2 rounded-full bg-gradient-to-r from-glow to-white"
												style={{
													width: `${habit.progress}%`,
												}}
											/>
										</div>
									</article>
								))}
							</div>
						</div>

						<div className="space-y-6">
							<div className="glass-panel rounded-[2rem] p-6">
								<p className="section-label">Daily review</p>
								<div className="mt-4 grid grid-cols-2 gap-3">
									{reviewItems.map((item) => (
										<div
											key={item.label}
											className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
										>
											<p className="text-xs uppercase tracking-[0.3em] text-smoke">
												{item.label}
											</p>
											<p className="mt-3 text-2xl font-medium text-pearl">
												{item.value}
											</p>
										</div>
									))}
								</div>
								<div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-smoke">
									Signed in as{" "}
									{user?.email || "local session"}.
								</div>
							</div>

							<div className="glass-panel rounded-[2rem] p-6">
								<p className="section-label">Notifications</p>
								<div className="mt-4 space-y-3">
									{[
										"Your study session starts in 15 minutes.",
										"You have 3 important tasks pending today.",
										"Small progress is still progress.",
									].map((message) => (
										<div
											key={message}
											className="rounded-[1.25rem] border border-white/10 bg-black/30 p-4 text-sm leading-6 text-smoke"
										>
											{message}
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
