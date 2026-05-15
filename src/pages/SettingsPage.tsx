import { AppLayout } from "../components/layout/AppLayout";

export function SettingsPage() {
	return (
		<AppLayout>
			<section>
				<div className="glass-panel rounded-[2rem] p-8">
					<p className="section-label">MVP shell</p>
					<h1 className="mt-4 font-display text-5xl text-pearl">
						Settings
					</h1>
					<p className="mt-4 max-w-2xl text-smoke">
						Profile and notification settings shell.
					</p>
				</div>
			</section>
		</AppLayout>
	);
}
