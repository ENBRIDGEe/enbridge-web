type StatPillProps = {
	label: string;
	value: string;
};

export function StatPill({ label, value }: StatPillProps) {
	return (
		<div className="glass-panel rounded-2xl px-4 py-3 text-left">
			<p className="text-xs uppercase tracking-[0.3em] text-smoke">
				{label}
			</p>
			<p className="mt-1 text-lg font-medium text-pearl">{value}</p>
		</div>
	);
}
