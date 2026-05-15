type SectionHeadingProps = {
	eyebrow: string;
	title: string;
	description: string;
};

export function SectionHeading({
	eyebrow,
	title,
	description,
}: SectionHeadingProps) {
	return (
		<div className="max-w-3xl space-y-4">
			<p className="section-label">{eyebrow}</p>
			<h2 className="font-display text-4xl leading-[0.96] text-pearl sm:text-5xl">
				{title}
			</h2>
			<p className="max-w-2xl text-base leading-7 text-smoke sm:text-lg">
				{description}
			</p>
		</div>
	);
}
