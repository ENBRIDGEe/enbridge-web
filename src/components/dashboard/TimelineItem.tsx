import type { TimelineTask } from "../../data/dashboardData";

type TimelineItemProps = {
	task: TimelineTask;
};

const statusStyles: Record<TimelineTask["status"], string> = {
	completed: "border-glow/30 bg-glow/10 text-pearl",
	"in-progress": "border-amber/30 bg-amber/10 text-pearl",
	pending: "border-white/10 bg-white/5 text-smoke",
	missed: "border-red-500/20 bg-red-500/10 text-red-200",
};

export function TimelineItem({ task }: TimelineItemProps) {
	return (
		<div className="grid grid-cols-[88px_1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
			<div className="text-sm text-smoke">{task.time}</div>
			<div>
				<p className="text-base text-pearl">{task.title}</p>
				<p className="mt-1 text-xs uppercase tracking-[0.3em] text-smoke">
					{task.category}
				</p>
			</div>
			<div
				className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.28em] ${statusStyles[task.status]}`}
			>
				{task.status}
			</div>
		</div>
	);
}
