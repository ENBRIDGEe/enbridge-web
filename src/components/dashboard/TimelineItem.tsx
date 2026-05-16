import type { DisplayTask } from "../../lib/taskDisplay";

type TimelineItemProps = {
	task: DisplayTask;
	onToggleCompletion?: (task: DisplayTask) => void;
};

export function TimelineItem({ task, onToggleCompletion }: TimelineItemProps) {
	const isCompleted = task.status === "completed";
	const buttonLabel = isCompleted ? "Mark as pending" : "Mark as completed";

	return (
		<div className="grid grid-cols-[88px_1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
			<div className="text-sm text-smoke">{task.time}</div>
			<div>
				<p
					className={`text-base ${
						isCompleted
							? "text-pearl line-through decoration-white/30"
							: "text-pearl"
					}`}
				>
					{task.title}
				</p>
				<p className="mt-1 text-xs uppercase tracking-[0.3em] text-smoke">
					{task.category}
				</p>
			</div>
			<button
				type="button"
				className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
					isCompleted
						? "border-glow/60 bg-glow/20 text-pearl"
						: "border-white/20 bg-white/[0.02] text-smoke hover:border-white/35 hover:bg-white/[0.05]"
				}`}
				aria-label={buttonLabel}
				title={buttonLabel}
				onClick={() => onToggleCompletion?.(task)}
				disabled={!task.id || !onToggleCompletion}
			>
				<svg
					viewBox="0 0 24 24"
					className={`h-4 w-4 ${isCompleted ? "opacity-100" : "opacity-60"}`}
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M20 6L9 17l-5-5" />
				</svg>
			</button>
		</div>
	);
}
