type ProgressRingProps = {
	value: number;
	label: string;
	subtitle: string;
};

export function ProgressRing({ value, label, subtitle }: ProgressRingProps) {
	const radius = 54;
	const stroke = 10;
	const normalizedRadius = radius - stroke * 0.5;
	const circumference = normalizedRadius * 2 * Math.PI;
	const strokeDashoffset = circumference - (value / 100) * circumference;

	return (
		<div className="glass-panel rounded-[2rem] p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="section-label">Daily progress</p>
					<h2 className="mt-3 font-display text-4xl text-pearl">
						{label}
					</h2>
					<p className="mt-3 max-w-xs text-sm leading-6 text-smoke">
						{subtitle}
					</p>
				</div>

				<div className="relative flex h-36 w-36 items-center justify-center">
					<svg
						className="h-36 w-36 -rotate-90 transform"
						viewBox="0 0 120 120"
						aria-hidden="true"
					>
						<circle
							cx="60"
							cy="60"
							r={normalizedRadius}
							stroke="rgba(255,255,255,0.08)"
							strokeWidth={stroke}
							fill="transparent"
						/>
						<circle
							cx="60"
							cy="60"
							r={normalizedRadius}
							stroke="url(#ringGradient)"
							strokeWidth={stroke}
							fill="transparent"
							strokeLinecap="round"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
						/>
						<defs>
							<linearGradient
								id="ringGradient"
								x1="0%"
								x2="100%"
								y1="0%"
								y2="0%"
							>
								<stop offset="0%" stopColor="#87f07a" />
								<stop offset="60%" stopColor="#f5f1ea" />
								<stop offset="100%" stopColor="#ffb36b" />
							</linearGradient>
						</defs>
					</svg>
					<div className="absolute text-center">
						<p className="text-3xl font-medium text-pearl">
							{value}%
						</p>
						<p className="text-xs uppercase tracking-[0.35em] text-smoke">
							complete
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
