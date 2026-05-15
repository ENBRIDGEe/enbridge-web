import { useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import {
	createEmptyHabitForm,
	habitFrequencyOptions,
	sampleHabits,
	type HabitFormState,
} from "../data/habitData";

const habitMoodCards = [
	{
		title: "Amazing",
		description: "You’re in a strong rhythm. Keep the streak alive.",
	},
	{ title: "Good", description: "A steady day is still progress." },
	{ title: "Okay", description: "Keep the habit small and consistent." },
	{ title: "Tired", description: "Lower the target, do not drop the chain." },
	{ title: "Burned out", description: "Recover first, then restart gently." },
];

export function HabitsPage() {
	const [form, setForm] = useState<HabitFormState>(createEmptyHabitForm());
	const [saved, setSaved] = useState(false);

	const progress = useMemo(
		() => Math.max(0, Math.min(100, Number(form.target) * 10)),
		[form.target],
	);

	function updateField<K extends keyof HabitFormState>(
		field: K,
		value: HabitFormState[K],
	) {
		setForm((current) => ({ ...current, [field]: value }));
	}

	function handleSave(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaved(true);
	}

	return (
		<AppLayout>
			<section className="space-y-6">
				<div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
					<p className="section-label">Habit tracker</p>
					<h1 className="mt-4 font-display text-5xl text-pearl">
						Consistency should feel visible.
					</h1>
					<p className="mt-4 max-w-3xl text-smoke">
						Track daily loops, streaks, and emotional state in one
						refined habit screen so the UI keeps the momentum
						encouraging instead of noisy.
					</p>
				</div>

				<div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
					<form onSubmit={handleSave} className="space-y-6">
						<div className="glass-panel rounded-[2rem] p-6">
							<p className="section-label">Create habit</p>
							<div className="mt-6 grid gap-4 md:grid-cols-2">
								<div className="md:col-span-2">
									<label className="text-sm text-smoke">
										Habit name
									</label>
									<input
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
										placeholder="Wake up before 7"
										value={form.name}
										onChange={(event) =>
											updateField(
												"name",
												event.target.value,
											)
										}
									/>
								</div>

								<div>
									<label className="text-sm text-smoke">
										Frequency
									</label>
									<select
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.frequency}
										onChange={(event) =>
											updateField(
												"frequency",
												event.target.value,
											)
										}
									>
										{habitFrequencyOptions.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="text-sm text-smoke">
										Target per week
									</label>
									<input
										type="number"
										min="1"
										max="7"
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
										value={form.target}
										onChange={(event) =>
											updateField(
												"target",
												event.target.value,
											)
										}
									/>
								</div>

								<div className="md:col-span-2">
									<label className="text-sm text-smoke">
										Completion history
									</label>
									<input
										className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
										placeholder="Mon, Tue, Wed"
										value={form.completionHistory}
										onChange={(event) =>
											updateField(
												"completionHistory",
												event.target.value,
											)
										}
									/>
								</div>
							</div>
						</div>

						<div className="glass-panel rounded-[2rem] p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="section-label">Momentum</p>
									<h2 className="mt-3 font-display text-4xl text-pearl">
										{form.name || "Habit preview"}
									</h2>
								</div>
								<div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.3em] text-smoke">
									{form.frequency}
								</div>
							</div>

							<div className="mt-6 grid gap-4 md:grid-cols-2">
								{sampleHabits.map((habit) => (
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
													{habit.frequency}
												</p>
											</div>
											<p className="text-lg font-medium text-pearl">
												{habit.streak}d
											</p>
										</div>
										<p className="mt-3 text-sm text-smoke">
											{habit.completionHistory}
										</p>
									</article>
								))}
							</div>

							<div className="mt-6 rounded-[1.75rem] border border-white/10 bg-black/30 p-5">
								<div className="flex items-center justify-between text-sm text-smoke">
									<span>Suggested completion goal</span>
									<span>{progress}%</span>
								</div>
								<div className="mt-3 h-2 rounded-full bg-white/10">
									<div
										className="h-2 rounded-full bg-gradient-to-r from-glow via-white to-amber"
										style={{ width: `${progress}%` }}
									/>
								</div>
								<p className="mt-4 text-sm leading-6 text-smoke">
									Keep the target realistic. The interface
									should motivate consistency, not overwhelm.
								</p>
							</div>
						</div>

						{saved ? (
							<div className="rounded-[2rem] border border-glow/20 bg-glow/10 p-5 text-sm text-pearl">
								Habit drafted locally for the MVP. When the
								backend exposes a habit endpoint, this form can
								be wired the same way as tasks.
							</div>
						) : null}
					</form>

					<aside className="space-y-6">
						<div className="glass-panel rounded-[2rem] p-6">
							<p className="section-label">Mood tracking</p>
							<div className="mt-5 grid gap-3">
								{habitMoodCards.map((card) => (
									<div
										key={card.title}
										className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
									>
										<p className="text-base text-pearl">
											{card.title}
										</p>
										<p className="mt-2 text-sm leading-6 text-smoke">
											{card.description}
										</p>
									</div>
								))}
							</div>
						</div>

						<div className="glass-panel rounded-[2rem] p-6">
							<p className="section-label">Streak logic</p>
							<div className="mt-4 space-y-3 text-sm leading-6 text-smoke">
								<p>• Make the next action feel small.</p>
								<p>
									• Reward daily completion with visible
									progress.
								</p>
								<p>
									• Keep recovery gentle when the chain
									breaks.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>
		</AppLayout>
	);
}
