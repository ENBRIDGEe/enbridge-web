import React from "react";
import { usePomodoro } from "../../lib/pomodoro";

function formatTime(seconds: number) {
	if (seconds <= 0) return "0:00";
	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	if (hrs > 0)
		return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function PomodoroTimer() {
	const {
		remaining,
		running,
		start,
		pause,
		resume,
		reset,
		setDurationMinutes,
		duration,
		sessions,
		resetSessions,
	} = usePomodoro();

	const options = [25, 60, 120];

	return (
		<div className="glass-panel rounded-[2rem] p-8 text-center">
			<p className="section-label">Focus</p>
			<h1 className="mt-4 font-display text-6xl text-pearl">
				{formatTime(remaining)}
			</h1>

			<div className="mt-2 text-lg text-smoke">
				Sessions completed: {sessions}
			</div>

			<div className="mt-6 flex items-center justify-center gap-4">
				{options.map((mins) => (
					<button
						key={mins}
						onClick={() => setDurationMinutes(mins)}
						className={`rounded-2xl px-4 py-2 text-sm ${Math.round(duration / 60) === mins ? "bg-amber text-black" : "bg-white/[0.03] text-smoke"}`}
					>
						{mins}m
					</button>
				))}
			</div>

			<div className="mt-8 flex items-center justify-center gap-4">
				{!running ? (
					<button
						onClick={() => start(Math.round(duration / 60))}
						className="button-primary px-6 py-3"
					>
						Start
					</button>
				) : (
					<button
						onClick={pause}
						className="button-primary px-6 py-3"
					>
						Pause
					</button>
				)}

				{running ? (
					<button
						onClick={reset}
						className="rounded-2xl px-4 py-2 bg-white/[0.03] text-smoke"
					>
						Reset
					</button>
				) : (
					<button
						onClick={resume}
						className="rounded-2xl px-4 py-2 bg-white/[0.03] text-smoke"
					>
						Resume
					</button>
				)}
			</div>

			<div className="mt-6">
				<button
					onClick={resetSessions}
					className="rounded-2xl px-4 py-2 text-xs uppercase tracking-wider bg-white/[0.03] text-smoke hover:bg-white/[0.05]"
				>
					Reset sessions
				</button>
			</div>
		</div>
	);
}

export default PomodoroTimer;
