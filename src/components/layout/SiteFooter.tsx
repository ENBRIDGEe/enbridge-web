export function SiteFooter() {
	return (
		<footer className="border-t border-white/5 py-10 text-sm text-smoke">
			<div className="page-shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-1 items-center">
					<p className="text-lg pt-1">&copy;</p>
					<p>2026 Enbridge. All rights reserved.</p>
				</div>
				<p>
					Follow us on{" "}
					<a
						href="https://twitter.com/enbridgeapp"
						target="_blank"
						rel="noopener noreferrer"
						className="underline transition hover:text-pearl"
					>
						Twitter
					</a>
				</p>
			</div>
		</footer>
	);
}
