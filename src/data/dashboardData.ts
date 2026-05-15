export type TimelineTask = {
	time: string;
	title: string;
	category: string;
	status: "completed" | "in-progress" | "pending" | "missed";
};

export type QuickAction = {
	label: string;
	hint: string;
};

export type HabitItem = {
	name: string;
	progress: number;
	streak: number;
};

export const dashboardMetrics = [
	{ label: "Productivity score", value: "82%", detail: "+6% vs yesterday" },
	{ label: "Tasks completed", value: "8 / 12", detail: "4 still open today" },
	{ label: "Current streak", value: "17 days", detail: "Best: 21 days" },
];

export const timelineTasks: TimelineTask[] = [
	{
		time: "6:30 AM",
		title: "Wake up and reset room",
		category: "Morning routine",
		status: "completed",
	},
	{
		time: "7:00 AM",
		title: "Gym session",
		category: "Health",
		status: "completed",
	},
	{
		time: "9:00 AM",
		title: "College classes",
		category: "Study",
		status: "completed",
	},
	{
		time: "5:00 PM",
		title: "Study session",
		category: "Assignment",
		status: "in-progress",
	},
	{
		time: "8:00 PM",
		title: "Finish assignment",
		category: "Projects",
		status: "pending",
	},
	{
		time: "10:30 PM",
		title: "Sleep on time",
		category: "Routine",
		status: "pending",
	},
];

export const quickActions: QuickAction[] = [
	{ label: "Add task", hint: "Study, chore, personal" },
	{ label: "Add habit", hint: "Daily or weekly loop" },
	{ label: "Start focus", hint: "Pomodoro session" },
	{ label: "Quick reminder", hint: "Lightweight nudge" },
];

export const habitItems: HabitItem[] = [
	{ name: "Wake up before 7", progress: 86, streak: 12 },
	{ name: "Gym consistency", progress: 72, streak: 9 },
	{ name: "Study blocks", progress: 64, streak: 17 },
];

export const reviewItems = [
	{ label: "Tasks completed", value: "8" },
	{ label: "Missed tasks", value: "1" },
	{ label: "Focus time", value: "4h 20m" },
	{ label: "Mood", value: "Good" },
];
