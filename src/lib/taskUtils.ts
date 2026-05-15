export type TaskFormState = {
	title: string;
	description: string;
	category: string;
	notes: string;
	date: string;
	startTime: string;
	deadline: string;
	duration: string;
	recurring: string;
	priority: string;
	reminder: string;
};

export type TaskPreview = TaskFormState & {
	status: "pending" | "in-progress" | "completed";
};

export const taskCategories = [
	"Study",
	"Personal",
	"Chores",
	"Health",
	"Gym",
	"Exams",
	"Projects",
];

export const recurringOptions = [
	"None",
	"Daily",
	"Weekly",
	"Monthly",
	"Custom",
];

export const priorityOptions = ["Low", "Medium", "High", "Critical"];

export const reminderOptions = [
	"10 mins before",
	"30 mins before",
	"1 hour before",
	"Smart reminder",
];

export function createEmptyTaskForm(): TaskFormState {
	const today = new Date();
	const date = today.toISOString().slice(0, 10);

	return {
		title: "",
		description: "",
		category: "Study",
		notes: "",
		date,
		startTime: "18:00",
		deadline: `${date}T20:00`,
		duration: "90",
		recurring: "None",
		priority: "High",
		reminder: "30 mins before",
	};
}

export function buildTaskPreview(form: TaskFormState): TaskPreview {
	return {
		...form,
		status: "pending",
	};
}
