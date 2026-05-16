import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import {
	createGoal,
	fetchGoals,
	addGoalActivity,
	removeGoalActivity,
	fetchGoalActivity,
	type GoalRecord,
} from "../lib/api";

const ACTIVITY_STORAGE_KEY = "enbridge_goal_activity";

type HabitFormState = {
	title: string;
	category: string;
	deadline: string;
};

type ActivityMap = Record<string, string[]>;

function createEmptyHabitForm(): HabitFormState {
	return {
		title: "",
		category: "habit",
		deadline: "",
	};
}

function toDateKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function buildActivityWindowForMonth(year: number, monthIndex: number) {
	const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
	return Array.from({ length: daysInMonth }, (_, i) => {
		const date = new Date(year, monthIndex, i + 1);
		return {
			key: toDateKey(date),
			label: date.toLocaleDateString([], {
				month: "short",
				day: "numeric",
			}),
			day: date.toLocaleDateString([], { weekday: "short" }),
		};
	});
}

function readActivityMap(): ActivityMap {
	if (typeof window === "undefined") {
		return {};
	}

	try {
		const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
		if (!raw) {
			return {};
		}

		const parsed = JSON.parse(raw) as ActivityMap;
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}

function formatDeadline(deadline?: string) {
	if (!deadline) {
		return "No deadline set";
	}

	const value = new Date(deadline);
	if (Number.isNaN(value.getTime())) {
		return deadline;
	}

	return value.toLocaleDateString([], {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function getActivityDates(activityMap: ActivityMap, goalId?: string) {
	if (!goalId) {
		return new Set<string>();
	}

	return new Set(activityMap[goalId] ?? []);
}

function getStreak(activityDates: Set<string>) {
	let streak = 0;
	const today = new Date();
	for (let offset = 0; offset < 365; offset += 1) {
		const date = new Date(today);
		date.setDate(date.getDate() - offset);
		if (activityDates.has(toDateKey(date))) {
			streak += 1;
			continue;
		}
		break;
	}
	return streak;
}

export function HabitsPage() {
	const [goals, setGoals] = useState<GoalRecord[]>([]);
	const [activityMap, setActivityMap] =
		useState<ActivityMap>(readActivityMap);
	const [form, setForm] = useState<HabitFormState>(createEmptyHabitForm());
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const titleInputRef = useRef<HTMLInputElement>(null);
	const location = useLocation();

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonthIndex = now.getMonth();
	const daysInMonth = new Date(
		currentYear,
		currentMonthIndex + 1,
		0,
	).getDate();

	const activityWindow = useMemo(
		() => buildActivityWindowForMonth(currentYear, currentMonthIndex),
		[currentYear, currentMonthIndex],
	);

	useEffect(() => {
		try {
			window.localStorage.setItem(
				ACTIVITY_STORAGE_KEY,
				JSON.stringify(activityMap),
			);
		} catch {
			// Ignore local persistence failures.
		}
	}, [activityMap]);

	const loadGoals = useCallback(async () => {
		try {
			setIsLoading(true);
			setError("");
			const response = await fetchGoals();
			const goalsArr = Array.isArray(response) ? response : [];
			setGoals(goalsArr);

			// Fetch activity for the current month for each goal and merge with local map
			const start = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}-01`;
			const end = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}-${daysInMonth}`;
			const local = readActivityMap();
			const merged: ActivityMap = { ...local };

			await Promise.allSettled(
				goalsArr
					.filter((g) => !!g.id)
					.map(async (g) => {
						try {
							const res = await fetchGoalActivity(
								g.id!,
								start,
								end,
							);
							if (res && Array.isArray(res.dates)) {
								const existing = new Set(merged[g.id!] ?? []);
								for (const d of res.dates) existing.add(d);
								merged[g.id!] = Array.from(existing);
							}
						} catch (err) {
							// ignore per-goal fetch failures
						}
					}),
			);

			setActivityMap(merged);
		} catch (loadError) {
			setGoals([]);
			setError(
				loadError instanceof Error
					? loadError.message
					: "Unable to load habits.",
			);
		} finally {
			setIsLoading(false);
		}
	}, [currentYear, currentMonthIndex, daysInMonth]);

	useEffect(() => {
		void loadGoals();
	}, [loadGoals]);

	useEffect(() => {
		if (location.hash === "#add-habit") {
			titleInputRef.current?.focus();
			titleInputRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	}, [location.hash]);

	const sortedGoals = useMemo(() => {
		return [...goals].sort((left, right) => {
			const leftDeadline = left.deadline
				? new Date(left.deadline).getTime()
				: Number.POSITIVE_INFINITY;
			const rightDeadline = right.deadline
				? new Date(right.deadline).getTime()
				: Number.POSITIVE_INFINITY;
			if (leftDeadline !== rightDeadline) {
				return leftDeadline - rightDeadline;
			}

			return (left.title || "").localeCompare(right.title || "");
		});
	}, [goals]);

	const completedTodayCount = useMemo(() => {
		const todayKey = toDateKey(new Date());
		return sortedGoals.filter((goal) => {
			if (!goal.id) return false;
			return activityMap[goal.id]?.includes(todayKey) ?? false;
		}).length;
	}, [activityMap, sortedGoals]);

	function updateField<K extends keyof HabitFormState>(
		field: K,
		value: HabitFormState[K],
	) {
		setForm((current) => ({ ...current, [field]: value }));
	}

	async function handleMarkDoneToday(goalId?: string) {
		if (!goalId) return;

		const todayKey = toDateKey(new Date());

		// compute prior state
		const priorDates = activityMap[goalId] ? [...activityMap[goalId]] : [];
		const priorHad = priorDates.includes(todayKey);

		// optimistic update
		setActivityMap((current) => {
			const existing = new Set(current[goalId] ?? []);
			if (priorHad) {
				existing.delete(todayKey);
			} else {
				existing.add(todayKey);
			}
			return { ...current, [goalId]: Array.from(existing) };
		});

		try {
			if (!priorHad) {
				await addGoalActivity(goalId, todayKey);
			} else {
				await removeGoalActivity(goalId, todayKey);
			}
		} catch (err) {
			// revert on error
			setActivityMap((current) => ({ ...current, [goalId]: priorDates }));
			setError(
				err instanceof Error
					? err.message
					: "Failed to update activity.",
			);
		}
	}

	async function handleSave(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!form.title.trim()) {
			setError("Add a habit name before saving.");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			await createGoal({
				title: form.title.trim(),
				category: form.category.trim() || "habit",
				deadline: form.deadline
					? `${form.deadline}T00:00:00`
					: new Date().toISOString(),
				status: "active",
			});

			await loadGoals();
			setForm(createEmptyHabitForm());
		} catch (saveError) {
			setError(
				saveError instanceof Error
					? saveError.message
					: "Failed to save habit.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<AppLayout>
			<section className="space-y-6">
				<div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
					<p className="section-label">Habit tracker</p>
					<h1 className="mt-4 font-display text-5xl text-pearl">
						Goals you can finish today.
					</h1>
					<p className="mt-4 max-w-3xl text-smoke">
						This screen is backed by{" "}
						<span className="text-pearl">/goals</span>. Each habit
						can be marked done today and tracked in a GitHub-like
						activity grid.
					</p>
				</div>

				{error ? (
					<div className="rounded-[1.5rem] border border-amber/20 bg-amber/10 p-4 text-sm text-pearl">
						{error}
					</div>
				) : null}

				<div className="grid gap-4 md:grid-cols-3">
					<div className="glass-panel rounded-[2rem] p-5">
						<p className="text-xs uppercase tracking-[0.28em] text-smoke">
							Total habits
						</p>
						<p className="mt-3 font-display text-4xl text-pearl">
							{sortedGoals.length}
						</p>
					</div>
					<div className="glass-panel rounded-[2rem] p-5">
						<p className="text-xs uppercase tracking-[0.28em] text-smoke">
							Done today
						</p>
						<p className="mt-3 font-display text-4xl text-pearl">
							{completedTodayCount}
						</p>
					</div>
					<div className="glass-panel rounded-[2rem] p-5">
						<p className="text-xs uppercase tracking-[0.28em] text-smoke">
							Activity window
						</p>
						<p className="mt-3 font-display text-4xl text-pearl">
							{daysInMonth}d
						</p>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					{isLoading ? (
						<div className="glass-panel rounded-[2rem] p-6 text-sm text-smoke">
							Loading habits...
						</div>
					) : sortedGoals.length === 0 ? (
						<div className="glass-panel rounded-[2rem] p-6 text-sm text-smoke md:col-span-3">
							No habits yet. Add your first one below.
						</div>
					) : (
						sortedGoals.map((goal, index) => {
							const goalId =
								goal.id || `${goal.title || "habit"}-${index}`;
							const activityDates = getActivityDates(
								activityMap,
								goal.id,
							);
							const streak = getStreak(activityDates);
							const completedToday = activityDates.has(
								toDateKey(new Date()),
							);

							return (
								<article
									key={goalId}
									className="glass-panel rounded-[2rem] p-6"
								>
									<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
										<div>
											<p className="section-label">
												Habit
											</p>
											<h2 className="mt-3 font-display text-3xl text-pearl">
												{goal.title || "Untitled habit"}
											</h2>
											<div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-smoke">
												<span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
													{goal.category || "habit"}
												</span>
												<span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
													Till{" "}
													{formatDeadline(
														goal.deadline,
													)}
												</span>
											</div>
										</div>

										<button
											type="button"
											onClick={() =>
												handleMarkDoneToday(goal.id)
											}
											className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
											disabled={
												completedToday || !goal.id
											}
										>
											{completedToday
												? "Done today"
												: "Done today"}
										</button>
									</div>

									<div className="mt-5">
										<div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-smoke">
											<span>Activity</span>
											<span>
												This month ({daysInMonth} days)
											</span>
										</div>
										<div className="grid grid-cols-7 gap-2">
											{activityWindow.map((day) => {
												const filled =
													activityDates.has(day.key);

												return (
													<div
														key={`${goalId}-${day.key}`}
														title={`${day.day} ${day.label}`}
														className={`aspect-square rounded-sm border transition ${
															filled
																? "border-emerald-300/40 bg-emerald-400"
																: "border-white/10 bg-white/[0.04]"
														}`}
													/>
												);
											})}
										</div>
										<div className="mt-3 flex items-center gap-3 text-xs text-smoke">
											<span className="inline-flex items-center gap-2">
												<span className="h-3 w-3 rounded-sm border border-white/10 bg-white/[0.04]" />
												No work
											</span>
											<span className="inline-flex items-center gap-2">
												<span className="h-3 w-3 rounded-sm border border-emerald-300/40 bg-emerald-400" />
												Worked
											</span>
										</div>
									</div>
								</article>
							);
						})
					)}
				</div>

				<form
					id="add-habit"
					onSubmit={handleSave}
					className="glass-panel rounded-[2rem] p-6"
				>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="section-label">Add habit</p>
							<h2 className="mt-3 font-display text-4xl text-pearl">
								Create a new goal
							</h2>
						</div>
						<button
							type="submit"
							disabled={isSubmitting || !form.title.trim()}
							className="rounded-2xl bg-gradient-to-r from-white/20 to-white/10 px-5 py-3 text-sm font-medium text-pearl transition hover:from-white/30 hover:to-white/20 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSubmitting ? "Adding..." : "Add habit"}
						</button>
					</div>

					<div className="mt-6 grid gap-4 md:grid-cols-3">
						<div className="md:col-span-2">
							<label className="text-sm text-smoke">
								Habit name
							</label>
							<input
								ref={titleInputRef}
								type="text"
								className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
								placeholder="Wake up before 7"
								value={form.title}
								onChange={(event) =>
									updateField("title", event.target.value)
								}
								disabled={isSubmitting}
							/>
						</div>

						<div>
							<label className="text-sm text-smoke">
								Category
							</label>
							<input
								type="text"
								className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
								placeholder="health"
								value={form.category}
								onChange={(event) =>
									updateField("category", event.target.value)
								}
								disabled={isSubmitting}
							/>
						</div>

						<div>
							<label className="text-sm text-smoke">
								Deadline
							</label>
							<input
								type="date"
								className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20 disabled:opacity-50"
								value={form.deadline}
								onChange={(event) =>
									updateField("deadline", event.target.value)
								}
								disabled={isSubmitting}
							/>
						</div>
					</div>
				</form>
			</section>
		</AppLayout>
	);
}
