import { Link } from "react-router-dom";

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur-2xl">
			<div className="page-shell flex h-16 items-center justify-between">
				<Link to="/" className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-pearl shadow-glow">
						E
					</div>
					<div>
						<p className="text-sm font-medium tracking-[0.35em] text-pearl">
							ENBRIDGE
						</p>
						<p className="text-xs tracking-[0.2em] text-smoke">
							discipline for students
						</p>
					</div>
				</Link>

				<nav className="hidden items-center gap-6 text-sm text-smoke md:flex">
					<a href="#features" className="transition hover:text-pearl">
						Features
					</a>
					<a href="#mvp" className="transition hover:text-pearl">
						MVP
					</a>
					<a href="#flow" className="transition hover:text-pearl">
						Flow
					</a>
				</nav>

				<div className="flex items-center gap-3">
					<Link
						to="/login"
						className="button-secondary hidden sm:inline-flex"
					>
						Log in
					</Link>
					<Link to="/register" className="button-primary">
						Get started
					</Link>
				</div>
			</div>
		</header>
	);
}
