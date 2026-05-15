type MetricCardProps = {
	label: string;
	value: string;
	detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
	return (
		<article className="glass-panel rounded-[1.75rem] p-5">
			<p className="text-xs uppercase tracking-[0.3em] text-smoke">
				{label}
			</p>
			<p className="mt-4 font-display text-4xl text-pearl">{value}</p>
			<p className="mt-3 text-sm text-smoke">{detail}</p>
		</article>
	);
}
