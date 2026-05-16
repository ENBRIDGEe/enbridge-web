import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { TimelineItem } from "../components/dashboard/TimelineItem";
import { apiRequest, fetchTasks, updateTaskCompletion } from "../lib/api";
import type { TaskRecord } from "../lib/taskTypes";
import {
	normalizeTask,
	sortDisplayTasks,
	type DisplayTask,
} from "../lib/taskDisplay";

export function TasksPage() {
	const [tasks, setTasks] = useState<TaskRecord[]>([]);
	const [isTasksLoading, setIsTasksLoading] = useState(true);
	const [tasksError, setTasksError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [title, setTitle] = useState("");
	const [dueDate, setDueDate] = useState("");
	const titleInputRef = useRef<HTMLInputElement>(null);
	const location = useLocation();

	function buildDueDateTime() {
		return dueDate ? `${dueDate}T00:00:00` : new Date().toISOString();
	}

	const loadTasks = useCallback(async () => {
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
	}, []);

	// Fetch tasks from backend
	useEffect(() => {
		void loadTasks();
	}, [loadTasks]);

	useEffect(() => {
		if (location.hash === "#add-task") {
			titleInputRef.current?.focus();
			titleInputRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	}, [location.hash]);

	const displayedTasks: DisplayTask[] = useMemo(
		() => sortDisplayTasks(tasks.map(normalizeTask)),
		[tasks],
	);

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
		} catch (error) {
			console.error("Failed to update task completion:", error);
			void loadTasks();
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		setIsSubmitting(true);
		setTasksError("");
		try {
			await apiRequest("/tasks", {
				method: "POST",
				body: JSON.stringify({
					title,
					due_date: buildDueDateTime(),
					completed: false,
				}),
				auth: true,
			});

			await loadTasks();
			setTitle("");
			setDueDate("");
		} catch (error) {
			setTasksError(
				error instanceof Error ? error.message : "Failed to save task.",
			);
			console.error("Failed to save task:", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<AppLayout liveTaskCount={tasks.length} isTasksLoading={isTasksLoading}>
			<section className="space-y-6 w-full">
				{/* Tasks List */}
				<div className="glass-panel rounded-[2rem] p-6">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="section-label">Your tasks</p>
							<h2 className="mt-3 font-display text-4xl text-pearl">
								All tasks
							</h2>
						</div>
						<div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.3em] text-smoke">
							{displayedTasks.length}
						</div>
					</div>

					{tasksError ? (
						<div className="mt-5 rounded-[1.5rem] border border-amber/20 bg-amber/10 p-4 text-sm text-pearl">
							{tasksError}
						</div>
					) : null}

					<div className="mt-6 space-y-3">
						{isTasksLoading ? (
							<div className="text-center py-8 text-smoke">
								Loading tasks...
							</div>
						) : displayedTasks.length === 0 ? (
							<div className="text-center py-8 text-smoke">
								No tasks yet. Create your first task below.
							</div>
						) : (
							displayedTasks.map((task) => (
								<TimelineItem
									key={
										task.id || `${task.time}-${task.title}`
									}
									task={task}
									onToggleCompletion={handleToggleTask}
								/>
							))
						)}
					</div>
				</div>

				{/* Task Creation Form */}
				<form
					id="add-task"
					onSubmit={handleSubmit}
					className="glass-panel rounded-[2rem] p-6"
				>
					<p className="section-label">Add a new task</p>
					<div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-3">
						<div className="flex-1">
							<label className="text-sm text-smoke">
								Task title
							</label>
							<input
								type="text"
								className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
								placeholder="Write a new task..."
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								disabled={isSubmitting}
							/>
						</div>

						<div className="md:flex-none">
							<label className="text-sm text-smoke">
								Due date
							</label>
							<div className="mt-2 relative">
								<input
									type="date"
									className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 pr-10 text-pearl outline-none focus:border-white/20 disabled:opacity-50"
									value={dueDate}
									onChange={(e) => setDueDate(e.target.value)}
									disabled={isSubmitting}
								/>
								<svg
									className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-smoke pointer-events-none"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
						</div>

						<button
							type="submit"
							disabled={isSubmitting || !title.trim()}
							className="rounded-2xl bg-gradient-to-r from-white/20 to-white/10 px-6 py-3 text-sm font-medium text-pearl transition hover:from-white/30 hover:to-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? "Adding..." : "Add task"}
						</button>
					</div>
				</form>
			</section>
		</AppLayout>
	);
}
