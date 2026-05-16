import type { QuickAction } from "../../data/dashboardData";

type QuickActionCardProps = {
	action: QuickAction;
	onClick: () => void;
};

export function QuickActionCard({ action, onClick }: QuickActionCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
		>
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-base text-pearl">{action.label}</p>
					<p className="mt-1 text-sm text-smoke">{action.hint}</p>
				</div>
				<div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 transition group-hover:border-white/20 group-hover:bg-white/10" />
			</div>
		</button>
	);
}
