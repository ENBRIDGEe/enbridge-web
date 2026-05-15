export type HabitFormState = {
	name: string;
	frequency: string;
	target: string;
	streak: number;
	completionHistory: string;
};

export const habitFrequencyOptions = ["Daily", "Weekly", "Custom"];

export function createEmptyHabitForm(): HabitFormState {
	return {
		name: "",
		frequency: "Daily",
		target: "1",
		streak: 0,
		completionHistory: "",
	};
}

export const sampleHabits = [
	{
		name: "Wake up before 7",
		frequency: "Daily",
		completionHistory: "Mon, Tue, Wed, Thu, Fri",
		streak: 12,
	},
	{
		name: "Gym consistency",
		frequency: "Weekly",
		completionHistory: "Mon, Wed, Sat",
		streak: 9,
	},
	{
		name: "Study blocks",
		frequency: "Daily",
		completionHistory: "Mon, Tue, Wed, Thu",
		streak: 17,
	},
];
