import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { TimelineItem } from "../components/dashboard/TimelineItem";
import { apiRequest } from "../lib/api";
import type { TaskRecord } from "../lib/taskTypes";
import {
	buildTaskPreview,
	createEmptyTaskForm,
	priorityOptions,
	recurringOptions,
	reminderOptions,
	taskCategories,
	type TaskFormState,
} from "../lib/taskUtils";

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
					: task.status === "missed"
						? "missed"
						: "pending",
	};
}

export function TasksPage() {
	const [form, setForm] = useState<TaskFormState>(createEmptyTaskForm());
	const [submitted, setSubmitted] = useState(false);
	const [tasks, setTasks] = useState<TaskRecord[]>([]);
	const [isTasksLoading, setIsTasksLoading] = useState(true);
	const [tasksError, setTasksError] = useState("");

	const preview = useMemo(() => buildTaskPreview(form), [form]);

	// Fetch tasks from backend
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

	const displayedTasks: DisplayTask[] = useMemo(
		() => tasks.map(normalizeTask),
		[tasks],
	);

	function updateField<K extends keyof TaskFormState>(
		field: K,
		value: TaskFormState[K],
	) {
		setForm((current) => ({ ...current, [field]: value }));
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitted(true);
	}

	return (
		<AppLayout liveTaskCount={tasks.length} isTasksLoading={isTasksLoading}>
			<section className="space-y-6">
				{/* Tasks List */}
				<div className="glass-panel rounded-[2rem] p-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="section-label">Your tasks</p>
							<h2 className="mt-3 font-display text-4xl text-pearl">
								All tasks
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
									key={`${task.time}-${task.title}`}
									task={task}
								/>
							))
						)}
					</div>
				</div>

				<div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
					<p className="section-label">Task creation</p>
					<h1 className="mt-4 font-display text-5xl text-pearl">
						Shape the day before it shapes you.
					</h1>
					<p className="mt-4 max-w-3xl text-smoke">
						Build a task once, then move it through scheduling,
						priority, and reminders in a clean MVP flow aligned to
						the backend task schema.
					</p>
				</div>

				<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="glass-panel rounded-[2rem] p-6">
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="section-label">Step 1</p>
									<h2 className="mt-3 font-display text-4xl text-pearl">
										Task details
									</h2>
								</div>
								<div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.3em] text-smoke">
									Core MVP
								</div>
							</div>

							<div className="mt-6 grid gap-4 md:grid-cols-2">
								<div className="md:col-span-2">
									<label className="text-sm text-smoke">
										Task title
									</label>
									<input
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
										placeholder="Finish physics assignment"
										value={form.title}
										onChange={(event) =>
											updateField(
												"title",
												event.target.value,
											)
										}
									/>
								</div>

								<div className="md:col-span-2">
									<label className="text-sm text-smoke">
										Description
									</label>
									<textarea
										className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
										placeholder="Write a few details so the task feels smaller and easier to start."
										value={form.description}
										onChange={(event) =>
											updateField(
												"description",
												event.target.value,
											)
										}
									/>
								</div>

								<div>
									<label className="text-sm text-smoke">
										Category
									</label>
									<select
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.category}
										onChange={(event) =>
											updateField(
												"category",
												event.target.value,
											)
										}
									>
										{taskCategories.map((category) => (
											<option
												key={category}
												value={category}
											>
												{category}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="text-sm text-smoke">
										Subject notes
									</label>
									<input
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
										placeholder="Electronics, math, or coding"
										value={form.notes}
										onChange={(event) =>
											updateField(
												"notes",
												event.target.value,
											)
										}
									/>
								</div>
							</div>
						</div>

						<div className="glass-panel rounded-[2rem] p-6">
							<p className="section-label">Step 2</p>
							<h2 className="mt-3 font-display text-4xl text-pearl">
								Scheduling
							</h2>

							<div className="mt-6 grid gap-4 md:grid-cols-2">
								<div>
									<label className="text-sm text-smoke">
										Date
									</label>
									<input
										type="date"
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.date}
										onChange={(event) =>
											updateField(
												"date",
												event.target.value,
											)
										}
									/>
								</div>
								<div>
									<label className="text-sm text-smoke">
										Start time
									</label>
									<input
										type="time"
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.startTime}
										onChange={(event) =>
											updateField(
												"startTime",
												event.target.value,
											)
										}
									/>
								</div>
								<div>
									<label className="text-sm text-smoke">
										Deadline
									</label>
									<input
										type="datetime-local"
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.deadline}
										onChange={(event) =>
											updateField(
												"deadline",
												event.target.value,
											)
										}
									/>
								</div>
								<div>
									<label className="text-sm text-smoke">
										Duration (minutes)
									</label>
									<input
										type="number"
										min="15"
										step="15"
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.duration}
										onChange={(event) =>
											updateField(
												"duration",
												event.target.value,
											)
										}
									/>
								</div>
							</div>
						</div>

						<div className="glass-panel rounded-[2rem] p-6">
							<p className="section-label">Step 3</p>
							<h2 className="mt-3 font-display text-4xl text-pearl">
								Priority and reminders
							</h2>

							<div className="mt-6 grid gap-4 md:grid-cols-2">
								<div>
									<label className="text-sm text-smoke">
										Recurrence
									</label>
									<select
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.recurring}
										onChange={(event) =>
											updateField(
												"recurring",
												event.target.value,
											)
										}
									>
										{recurringOptions.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="text-sm text-smoke">
										Priority
									</label>
									<select
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.priority}
										onChange={(event) =>
											updateField(
												"priority",
												event.target.value,
											)
										}
									>
										{priorityOptions.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</select>
								</div>

								<div className="md:col-span-2">
									<label className="text-sm text-smoke">
										Reminder
									</label>
									<select
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.reminder}
										onChange={(event) =>
											updateField(
												"reminder",
												event.target.value,
											)
										}
									>
										{reminderOptions.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</select>
								</div>

								<div className="md:col-span-2">
									<button className="button-primary w-full">
										Save task to dashboard
									</button>
								</div>
							</div>
						</div>

						{submitted ? (
							<div className="rounded-[2rem] border border-glow/20 bg-glow/10 p-5 text-sm text-pearl">
								Task drafted locally. In the next backend pass,
								this form can post directly to the /tasks
								endpoint.
							</div>
						) : null}
					</form>

					<aside className="space-y-6">
						<div className="glass-panel rounded-[2rem] p-6">
							<p className="section-label">Preview</p>
							<h2 className="mt-3 font-display text-4xl text-pearl">
								What you’re about to save
							</h2>

							<div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
								<p className="text-xs uppercase tracking-[0.3em] text-smoke">
									{preview.category}
								</p>
								<p className="mt-3 text-2xl text-pearl">
									{preview.title || "Task title"}{" "}
								</p>
								<p className="mt-3 text-sm leading-6 text-smoke">
									{preview.description ||
										"Description will appear here once you start typing."}
								</p>

								<div className="mt-5 grid gap-3 text-sm text-smoke">
									<div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
										<span>Date</span>
										<span>{preview.date}</span>
									</div>
									<div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
										<span>Start</span>
										<span>{preview.startTime}</span>
									</div>
									<div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
										<span>Priority</span>
										<span>{preview.priority}</span>
									</div>
									<div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
										<span>Reminder</span>
										<span>{preview.reminder}</span>
									</div>
								</div>
							</div>
						</div>

						<div className="glass-panel rounded-[2rem] p-6">
							<p className="section-label">MVP notes</p>
							<div className="mt-4 space-y-3 text-sm leading-6 text-smoke">
								<p>
									• Study, chores, gym, and personal tasks all
									live in the same flow.
								</p>
								<p>
									• This UI keeps the backend shape in mind,
									but remains frontend-first.
								</p>
								<p>
									• Recurring schedules and smart reminders
									are ready for the API layer later.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>
		</AppLayout>
	);
}
