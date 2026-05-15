export function SettingsPage() {
	return (
		<ShellPage
			title="Settings"
			description="Profile and notification settings shell."
		/>
	);
}

function ShellPage({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<main className="page-shell py-10">
			<div className="glass-panel rounded-[2rem] p-8">
				<p className="section-label">MVP shell</p>
				<h1 className="mt-4 font-display text-5xl text-pearl">
					{title}
				</h1>
				<p className="mt-4 max-w-2xl text-smoke">{description}</p>
			</div>
		</main>
	);
}
