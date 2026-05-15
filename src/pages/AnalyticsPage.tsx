import { AppLayout } from "../components/layout/AppLayout";

export function AnalyticsPage() {
	return (
		<AppLayout>
			<section>
				<div className="glass-panel rounded-[2rem] p-8">
					<p className="section-label">MVP shell</p>
					<h1 className="mt-4 font-display text-5xl text-pearl">
						Analytics
					</h1>
					<p className="mt-4 max-w-2xl text-smoke">
						Daily review and weekly trend shell.
					</p>
				</div>
			</section>
		</AppLayout>
	);
}
