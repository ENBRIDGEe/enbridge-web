type FeatureCardProps = {
	title: string;
	description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
	return (
		<article className="glass-panel group rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07]">
			<div className="mb-8 h-12 w-12 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent" />
			<h3 className="text-xl font-medium text-pearl">{title}</h3>
			<p className="mt-3 max-w-sm text-sm leading-6 text-smoke">
				{description}
			</p>
		</article>
	);
}
