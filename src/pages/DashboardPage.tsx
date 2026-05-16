import { useCallback, useEffect, useMemo, useState } from "react";
import { MetricCard } from "../components/dashboard/MetricCard";
import { ProgressRing } from "../components/dashboard/ProgressRing";
import { QuickActionCard } from "../components/dashboard/QuickActionCard";
import { TimelineItem } from "../components/dashboard/TimelineItem";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import {
	apiRequest,
	fetchFocusTime,
	fetchTasks,
	updateTaskCompletion,
} from "../lib/api";
import type { TaskRecord } from "../lib/taskTypes";
import { dashboardMetrics } from "../data/dashboardData";
import { fetchGoals, fetchGoalActivity } from "../lib/api";
import { PomodoroCard } from "../components/pomodoro/PomodoroCard";
import { usePomodoro } from "../lib/pomodoro";
import {
	normalizeTask,
	sortDisplayTasks,
	type DisplayTask,
} from "../lib/taskDisplay";

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
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();
	const { sessions } = usePomodoro();
	const { remaining, running, duration, start, pause, resume } =
		usePomodoro();
	const [tasks, setTasks] = useState<TaskRecord[]>([]);
	const [isTasksLoading, setIsTasksLoading] = useState(true);
	const [tasksError, setTasksError] = useState("");
	const [focusTimeDisplay, setFocusTimeDisplay] = useState("0m");
	const [isFocusTimeLoading, setIsFocusTimeLoading] = useState(false);
	const [isHabitsLoading, setIsHabitsLoading] = useState(true);
	// Goals and habit streaks
	const [goals, setGoals] = useState<import("../lib/api").GoalRecord[]>([]);
	const [habitData, setHabitData] = useState<
		{
			name: string;
			progress: number;
			streak: number;
		}[]
	>([]);

	useEffect(() => {
		let isMounted = true;

		async function loadTasks() {
			try {
				setIsTasksLoading(true);
				setTasksError("");
				const response = await fetchTasks();

				if (isMounted) {
					setTasks(response);
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

	// Fetch focus time from backend
	async function fetchTodayFocus() {
		setIsFocusTimeLoading(true);
		try {
			const today = new Date().toISOString().split("T")[0];
			const data = await fetchFocusTime(today, "day");
			setFocusTimeDisplay(data.focus_time_display || "0m");
		} catch (error) {
			setFocusTimeDisplay("0m");
			console.error("Failed to fetch focus time:", error);
		} finally {
			setIsFocusTimeLoading(false);
		}
	}

	useEffect(() => {
		// fetch on mount and whenever sessions changes (completed session)
		void fetchTodayFocus();
	}, [sessions]);

	// Listen for storage events signaled by Pomodoro provider when partial sessions recorded
	useEffect(() => {
		function onStorage(e: StorageEvent) {
			if (e.key === "pomodoro_last_update") {
				void fetchTodayFocus();
			}
		}
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	const refreshTasks = useMemo(() => {
		return async () => {
			try {
				setIsTasksLoading(true);
				setTasksError("");
				const response = await fetchTasks();

				setTasks(response);
			} catch (error) {
				setTasks([]);
				setTasksError(
					error instanceof Error
						? error.message
						: "Unable to load tasks.",
				);
			} finally {
				setIsTasksLoading(false);
			}
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
	const openTaskCount = Math.max(liveTaskCount - completedTaskCount, 0);
	const habitCount = habitData.length;

	const handleQuickReminder = useCallback(async () => {
		const reminderText =
			openTaskCount > 0
				? `${openTaskCount} task${openTaskCount === 1 ? "" : "s"} still open today.`
				: "You have no open tasks today. Plan the next one when ready.";

		if (typeof window !== "undefined" && "Notification" in window) {
			try {
				const permission =
					Notification.permission === "granted"
						? "granted"
						: Notification.permission === "denied"
							? "denied"
							: await Notification.requestPermission();

				if (permission === "granted") {
					new Notification("Enbridge reminder", {
						body: reminderText,
					});
					return;
				}
			} catch (error) {
				console.error(
					"Failed to trigger reminder notification:",
					error,
				);
			}
		}

		navigate("/app/tasks#add-task");
	}, [navigate, openTaskCount]);

	const quickActionCards = useMemo(
		() => [
			{
				label: "Add task",
				hint:
					openTaskCount > 0
						? `${openTaskCount} open today`
						: "Create your next task",
				onClick: () => navigate("/app/tasks#add-task"),
			},
			{
				label: "Add habit",
				hint:
					habitCount > 0
						? `${habitCount} habit${habitCount === 1 ? "" : "s"} tracked`
						: "Start a new streak",
				onClick: () => navigate("/app/habits#add-habit"),
			},
			{
				label: running
					? "Pause focus"
					: remaining < duration
						? "Resume focus"
						: "Start focus",
				hint: running
					? `${Math.max(1, Math.ceil(remaining / 60))} min left`
					: remaining < duration
						? "Continue the current Pomodoro"
						: `${Math.max(1, Math.round(duration / 60))} minute deep work`,
				onClick: () => {
					if (running) {
						pause();
						return;
					}

					if (remaining < duration) {
						resume();
						return;
					}

					start(Math.max(1, Math.round(duration / 60)));
				},
			},
			{
				label: "Quick reminder",
				hint:
					openTaskCount > 0
						? `${openTaskCount} task${openTaskCount === 1 ? "" : "s"} waiting`
						: "No open tasks right now",
				onClick: handleQuickReminder,
			},
		],
		[
			duration,
			habitCount,
			handleQuickReminder,
			navigate,
			openTaskCount,
			pause,
			remaining,
			running,
			resume,
			start,
		],
	);

	const dynamicDashboardMetrics = useMemo(
		() =>
			dashboardMetrics.map((metric) => {
				if (metric.label !== "Tasks completed") {
					return metric;
				}

				const remainingTasks = Math.max(
					liveTaskCount - completedTaskCount,
					0,
				);
				return {
					...metric,
					value: `${completedTaskCount} / ${liveTaskCount}`,
					detail:
						liveTaskCount > 0
							? `${remainingTasks} still open today`
							: "No tasks scheduled today",
				};
			}),
		[liveTaskCount, completedTaskCount],
	);

	useEffect(() => {
		let mounted = true;
		async function loadGoalsAndActivity() {
			setIsHabitsLoading(true);
			try {
				const g = await fetchGoals();
				if (!mounted) return;
				setGoals(g);

				const items: {
					name: string;
					progress: number;
					streak: number;
				}[] = [];
				let highest = 0;
				await Promise.all(
					g
						.filter((gg) => !!gg.id)
						.map(async (gg) => {
							try {
								const res = await fetchGoalActivity(gg.id!);
								const dates = res?.dates ?? [];

								// compute streak similar to HabitsPage.getStreak
								let streak = 0;
								const today = new Date();
								for (
									let offset = 0;
									offset < 365;
									offset += 1
								) {
									const date = new Date(today);
									date.setDate(date.getDate() - offset);
									const key = `${date.getFullYear()}-${String(
										date.getMonth() + 1,
									).padStart(2, "0")}-${String(
										date.getDate(),
									).padStart(2, "0")}`;
									if (dates.includes(key)) {
										streak += 1;
										continue;
									}
									break;
								}

								// progress as percentage of days in current month with activity
								const now = new Date();
								const daysInMonth = new Date(
									now.getFullYear(),
									now.getMonth() + 1,
									0,
								).getDate();
								const monthKeys = new Set(
									(dates || []).filter((d) =>
										d.startsWith(
											`${now.getFullYear()}-${String(
												now.getMonth() + 1,
											).padStart(2, "0")}`,
										),
									),
								);
								const progress = Math.round(
									(monthKeys.size / daysInMonth) * 100,
								);

								items.push({
									name: gg.title || "Untitled",
									progress,
									streak,
								});
								if (streak > highest) highest = streak;
							} catch (err) {
								// ignore per-goal errors
							}
						}),
				);

				if (!mounted) return;
				setHabitData(items);
			} catch (err) {
				// ignore
			} finally {
				if (mounted) {
					setIsHabitsLoading(false);
				}
			}
		}

		void loadGoalsAndActivity();
		return () => {
			mounted = false;
		};
	}, []);

	// Compute productivity: number of tasks completed today, and compare to yesterday
	const productivity = useMemo(() => {
		const getDateKey = (rawDate: string | undefined | null) => {
			if (!rawDate) {
				return null;
			}

			const prefix = rawDate.slice(0, 10);
			if (/^\d{4}-\d{2}-\d{2}$/.test(prefix)) {
				return prefix;
			}

			return null;
		};

		const getTaskCreatedKey = (task: TaskRecord) => {
			const rawDate =
				task.created_at ??
				task.created_date ??
				task.createdAt ??
				task.due_date ??
				null;

			return getDateKey(rawDate);
		};

		const getTaskCompletedKey = (task: TaskRecord) => {
			const rawDate = task.completed_at ?? null;

			if (rawDate) {
				return getDateKey(rawDate);
			}

			return task.completed || task.status === "completed"
				? todayKey
				: null;
		};

		const today = new Date();
		const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

		const createdTodayTasks = tasks.filter((task) => {
			return getTaskCreatedKey(task) === todayKey;
		});

		const completedTodayCreatedToday = createdTodayTasks.filter(
			(task) => getTaskCompletedKey(task) === todayKey,
		).length;

		const createdYesterdayTasks = tasks.filter((task) => {
			return getTaskCreatedKey(task) === yesterdayKey;
		});

		const completedYesterdayCreatedYesterday = createdYesterdayTasks.filter(
			(task) => getTaskCompletedKey(task) === yesterdayKey,
		).length;
		const yesterdayProductivityPercent =
			createdYesterdayTasks.length > 0
				? Math.round(
						(completedYesterdayCreatedYesterday /
							createdYesterdayTasks.length) *
							100,
					)
				: null;
		const fallbackProductivityPercent =
			liveTaskCount > 0
				? Math.round((completedTaskCount / liveTaskCount) * 100)
				: 0;
		const todayProductivityPercent =
			createdTodayTasks.length > 0
				? Math.round(
						(completedTodayCreatedToday /
							createdTodayTasks.length) *
							100,
					)
				: fallbackProductivityPercent;

		const delta =
			yesterdayProductivityPercent === null
				? todayProductivityPercent
				: todayProductivityPercent - yesterdayProductivityPercent;

		return {
			completedToday: todayProductivityPercent,
			completedCountToday: completedTodayCreatedToday,
			totalCreatedToday: createdTodayTasks.length,
			completedYesterday: completedYesterdayCreatedYesterday,
			delta,
			hasYesterday: yesterdayProductivityPercent !== null,
		};
	}, [tasks, liveTaskCount, completedTaskCount]);

	const dynamicDashboardMetrics2 = useMemo(() => {
		return dashboardMetrics.map((metric) => {
			if (metric.label === "Productivity score") {
				const value = `${productivity.completedToday}%`;
				const detail = productivity.hasYesterday
					? `${productivity.delta >= 0 ? "+" : ""}${productivity.delta}% vs yesterday`
					: `+${productivity.completedToday}% vs yesterday`;
				return { ...metric, value, detail };
			}

			if (metric.label === "Current streak") {
				const highest = habitData.length
					? Math.max(...habitData.map((h) => h.streak))
					: 0;
				return {
					...metric,
					value: `${highest} days`,
					detail: `Best: ${highest} days`,
				};
			}

			if (metric.label === "Tasks completed") {
				const remainingTasks = Math.max(
					liveTaskCount - completedTaskCount,
					0,
				);
				return {
					...metric,
					value: `${completedTaskCount} / ${liveTaskCount}`,
					detail:
						liveTaskCount > 0
							? `${remainingTasks} still open today`
							: "No tasks scheduled today",
				};
			}

			return metric;
		});
	}, [productivity, habitData, liveTaskCount, completedTaskCount]);

	const liveProgress =
		liveTaskCount > 0
			? Math.round((completedTaskCount / liveTaskCount) * 100)
			: 0;
	const displayedTasks: DisplayTask[] = useMemo(() => {
		const normalized = tasks.map(normalizeTask);
		return sortDisplayTasks(normalized).slice(0, 6);
	}, [tasks]);

	useEffect(() => {
		void refreshTasks();
	}, [refreshTasks]);

	async function handleToggleTask(task: DisplayTask) {
		if (!task.id) return;

		const nextCompleted = task.status !== "completed";
		setTasks((current) =>
			current.map((item) =>
				item.id === task.id
					? {
							...item,
							completed: nextCompleted,
							status: nextCompleted ? "completed" : "pending",
						}
					: item,
			),
		);

		try {
			await updateTaskCompletion(task.id, nextCompleted);
			// server returns `completed_at` on task reads; prefer server timestamps
		} catch (error) {
			console.error("Failed to update task completion:", error);
			void refreshTasks();
		}
	}

	return (
		<AppLayout
			liveTaskCount={liveTaskCount}
			isTasksLoading={isTasksLoading}
		>
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
									Your day is already in motion. This is the
									central command for tasks, habits, focus,
									reminders, and review.
								</p>
							</div>
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
					{dynamicDashboardMetrics2.map((metric) => (
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
									Today's schedule
								</h2>
							</div>
						</div>

						{tasksError ? (
							<div className="mt-5 rounded-[1.5rem] border border-amber/20 bg-amber/10 p-4 text-sm text-pearl">
								{tasksError}
							</div>
						) : null}

						<div className="mt-6 space-y-3">
							{displayedTasks.length === 0 ? (
								<div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-smoke">
									No scheduled tasks yet.
								</div>
							) : (
								displayedTasks.map((task) => (
									<TimelineItem
										key={
											task.id ||
											`${task.time}-${task.title}`
										}
										task={task}
										onToggleCompletion={handleToggleTask}
									/>
								))
							)}
						</div>
					</div>

					<div className="space-y-6">
						<div className="glass-panel rounded-[2rem] p-6">
							<p className="section-label">Quick actions</p>
							<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
								{quickActionCards.map((action) => (
									<QuickActionCard
										key={action.label}
										action={action}
										onClick={action.onClick}
									/>
								))}
							</div>
						</div>

						<div className="glass-panel rounded-[2rem] p-6">
							<p className="section-label">Focus mode</p>
							<div className="mt-4">
								{/* Pomodoro card (shared state) */}
								<PomodoroCard />
							</div>
						</div>
					</div>
				</div>

				<div className="grid gap-6">
					<div className="glass-panel rounded-[2rem] p-6">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="section-label">Habit streaks</p>
								<h2 className="mt-3 font-display text-4xl text-pearl">
									Build the loop.
								</h2>
							</div>
						</div>

						<div className="mt-6 grid gap-4 lg:grid-cols-3">
							{isHabitsLoading ? (
								<div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-sm text-smoke lg:col-span-3">
									Loading habit streaks...
								</div>
							) : habitData.length > 0 ? (
								habitData.map((habit) => (
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
								))
							) : (
								<div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-sm text-smoke lg:col-span-3">
									No habit streaks yet.
								</div>
							)}
						</div>
					</div>
				</div>
			</section>
		</AppLayout>
	);
}
