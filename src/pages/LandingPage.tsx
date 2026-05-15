import { Link } from "react-router-dom";
import { appHighlights, ctaStats, mvpModules } from "../data/siteData";
import { FeatureCard } from "../components/ui/FeatureCard";
import { SectionHeading } from "../components/ui/SectionHeading";
import { StatPill } from "../components/ui/StatPill";

export function LandingPage() {
	return (
		<main>
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 bg-hero-radial opacity-100" />
				<div className="absolute inset-0 bg-grain bg-[length:48px_48px] opacity-[0.04]" />
				<div className="page-shell relative py-14 sm:py-20 lg:py-24">
					<div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
						<div className="space-y-8">
							<div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-smoke">
								MVP only
								<span className="h-1.5 w-1.5 rounded-full bg-glow shadow-[0_0_18px_rgba(135,240,122,0.75)]" />
								Student productivity
							</div>

							<div className="space-y-6">
								<p className="section-label">Enbridge</p>
								<h1 className="display-heading max-w-4xl">
									crafted for the
									<br />
									disciplined student.
								</h1>
								<p className="max-w-2xl text-lg leading-8 text-smoke sm:text-xl">
									A CRED-inspired productivity experience for
									students who want their tasks, habits, focus
									sessions, and daily momentum in one calm,
									premium control room.
								</p>
							</div>

							<div className="flex flex-col gap-4 sm:flex-row">
								<Link to="/register" className="button-primary">
									Start the MVP
								</Link>
								<a href="#mvp" className="button-secondary">
									Explore the flow
								</a>
							</div>

							<div className="grid gap-3 sm:grid-cols-3">
								{ctaStats.map((stat) => (
									<StatPill
										key={stat.label}
										label={stat.label}
										value={stat.value}
									/>
								))}
							</div>
						</div>

						<div className="glass-panel relative overflow-hidden rounded-[2rem] border-white/10 p-5 shadow-soft">
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(135,240,122,0.12),transparent_40%)]" />
							<div className="relative space-y-5">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-xs uppercase tracking-[0.4em] text-smoke">
											Today
										</p>
										<p className="mt-2 font-display text-4xl text-pearl">
											8 of 12
										</p>
										<p className="text-sm text-smoke">
											tasks completed
										</p>
									</div>
									<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
										<p className="text-xs uppercase tracking-[0.3em] text-smoke">
											Streak
										</p>
										<p className="mt-1 text-2xl font-medium text-pearl">
											17 days
										</p>
									</div>
								</div>

								<div className="rounded-[1.75rem] border border-white/10 bg-black/40 p-5">
									<div className="flex items-center justify-between text-sm text-smoke">
										<span>Focus mode</span>
										<span>25:00</span>
									</div>
									<div className="mt-4 h-2 rounded-full bg-white/10">
										<div className="h-2 w-3/5 rounded-full bg-gradient-to-r from-glow via-white to-amber" />
									</div>
									<p className="mt-4 text-sm leading-6 text-smoke">
										“Small progress every day leads to big
										results.”
									</p>
								</div>

								<div className="grid gap-3 sm:grid-cols-2">
									{mvpModules.slice(0, 4).map((module) => (
										<div
											key={module}
											className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-pearl"
										>
											{module}
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section
				id="features"
				className="page-shell py-14 sm:py-20 lg:py-24"
			>
				<SectionHeading
					eyebrow="Why it feels premium"
					title="A minimal interface with enough gravity to make productivity feel deliberate."
					description="The MVP keeps the surface clean and focused: one dashboard, one task system, one habit layer, one focus experience, and one review loop."
				/>
				<div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{appHighlights.map((item) => (
						<FeatureCard
							key={item.title}
							title={item.title}
							description={item.description}
						/>
					))}
				</div>
			</section>

			<section id="mvp" className="page-shell py-14 sm:py-20 lg:py-24">
				<SectionHeading
					eyebrow="MVP scope"
					title="Only the essentials for launch, built as reusable routes and components."
					description="Advanced AI, social, and recovery features stay out of this first pass so the product feels focused and shippable."
				/>
				<div className="mt-10 grid gap-4 lg:grid-cols-2">
					{mvpModules.map((module, index) => (
						<div
							key={module}
							className="glass-panel flex items-center justify-between rounded-3xl px-5 py-4"
						>
							<div>
								<p className="text-xs uppercase tracking-[0.3em] text-smoke">
									0{index + 1}
								</p>
								<p className="mt-1 text-lg text-pearl">
									{module}
								</p>
							</div>
							<div className="h-3 w-3 rounded-full bg-glow shadow-[0_0_16px_rgba(135,240,122,0.75)]" />
						</div>
					))}
				</div>
			</section>

			<section id="flow" className="page-shell py-14 sm:py-20 lg:py-24">
				<SectionHeading
					eyebrow="Next step"
					title="The app shell is ready to expand into onboarding, dashboard, tasks, habits, and focus."
					description="From here, the next pass can flesh out the dashboard and core MVP flows without changing the design system or routing structure."
				/>
				<div className="mt-10 flex flex-col gap-4 sm:flex-row">
					<Link to="/app/dashboard" className="button-primary">
						Open dashboard shell
					</Link>
					<Link to="/login" className="button-secondary">
						See auth screens
					</Link>
				</div>
			</section>
		</main>
	);
}
