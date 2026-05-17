import type { TaskRecord } from "./taskTypes";

export type DisplayTaskStatus =
	| "completed"
	| "in-progress"
	| "pending"
	| "missed";

export type DisplayTask = {
	id?: string;
	time: string;
	title: string;
	category: string;
	status: DisplayTaskStatus;
	dueDate?: string;
};

const statusPriority: Record<DisplayTaskStatus, number> = {
	pending: 0,
	"in-progress": 1,
	missed: 2,
	completed: 3,
};

function getDueDateValue(task: DisplayTask) {
	if (!task.dueDate) return Number.POSITIVE_INFINITY;
	const value = new Date(task.dueDate).getTime();
	return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

export function normalizeTask(task: TaskRecord, index: number): DisplayTask {
	const dueDate = task.due_date || task.dueDate || undefined;
	const dueDateValue = dueDate ? new Date(dueDate) : null;
	const hasValidDueDate =
		dueDateValue !== null && !Number.isNaN(dueDateValue.getTime());
	const time = hasValidDueDate
		? dueDateValue.toLocaleTimeString([], {
				hour: "numeric",
				minute: "2-digit",
			})
		: `Task ${index + 1}`;

	const isCompleted =
		task.completed || task.status === "completed" || Boolean(task.completed_at);
	const status: DisplayTaskStatus = isCompleted
		? "completed"
		: task.status === "in-progress"
			? "in-progress"
			: task.status === "missed"
				? "missed"
				: "pending";

	return {
		id: task.id,
		time,
		title: task.title || task.task_name || task.name || `Task ${index + 1}`,
		category: task.category || "Task",
		status,
		dueDate,
	};
}

export function sortDisplayTasks(tasks: DisplayTask[]) {
	return [...tasks].sort((left, right) => {
		const statusDiff =
			statusPriority[left.status] - statusPriority[right.status];
		if (statusDiff !== 0) return statusDiff;

		const leftDue = getDueDateValue(left);
		const rightDue = getDueDateValue(right);
		if (leftDue !== rightDue) return leftDue - rightDue;

		return left.title.localeCompare(right.title);
	});
}
