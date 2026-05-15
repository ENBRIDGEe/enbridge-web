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

export function PomodoroCard({ compact = false }: { compact?: boolean }) {
	const {
		remaining,
		running,
		start,
		pause,
		resume,
		reset,
		duration,
		sessions,
	} = usePomodoro();

	const display = formatTime(remaining ?? duration ?? 1500);

	return (
		<div className="mt-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm uppercase tracking-[0.3em] text-smoke">
						Pomodoro
					</p>
					<p className="mt-3 font-display text-4xl text-pearl">
						{display}
					</p>
				</div>
				<div className="flex flex-col items-end gap-2">
					<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-smoke">
						{sessions} sessions
					</div>
					<div className="flex gap-2 mt-2">
						{!running ? (
							<button
								onClick={() =>
									start(
										Math.max(1, Math.round(duration / 60)),
									)
								}
								className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-smoke"
							>
								Start
							</button>
						) : (
							<button
								onClick={pause}
								className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-smoke"
							>
								Pause
							</button>
						)}

						<button
							onClick={() => reset(Math.round(duration / 60))}
							className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-smoke"
						>
							Reset
						</button>
					</div>
				</div>
			</div>
			{!compact ? (
				<p className="mt-4 text-sm leading-6 text-smoke">
					Minimal focus mode, soft sound, and a clean completion state
					for deep work.
				</p>
			) : null}
		</div>
	);
}

export default PomodoroCard;
