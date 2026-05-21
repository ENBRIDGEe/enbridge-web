import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Google } from "../components/Google";
import {
	API_BASE_URL,
	API_CONFIGURATION_ERROR,
	clearAllTokens,
	loginWithPassword,
	registerUser,
} from "../lib/api";
import { useAuth } from "../lib/auth";

type AuthPageProps = {
	mode: "login" | "register";
};

export function AuthPage({ mode }: AuthPageProps) {
	const isLogin = mode === "login";
	const navigate = useNavigate();
	const { refreshUser } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const title = useMemo(
		() => (isLogin ? "Welcome back." : "Create your account."),
		[isLogin],
	);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		setErrorMessage("");

		try {
			clearAllTokens();
			if (isLogin) {
				await loginWithPassword(email, password);
			} else {
				await registerUser({ name, email, password });
			}

			const profile = await refreshUser();
			if (!profile) {
				throw new Error(
					"Signed in, but the profile could not be loaded.",
				);
			}

			navigate("/app/dashboard", { replace: true });
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Authentication failed.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="page-shell relative min-h-screen py-10">
			<Link
				to="/"
				className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-smoke transition hover:border-white/20 hover:bg-white/5 hover:text-pearl sm:left-6 sm:top-6"
			>
				<span aria-hidden="true">←</span>
				Back
			</Link>

			<div className="mx-auto flex w-full max-w-xl flex-col gap-8 pt-16">
				<section className="glass-panel rounded-[2rem] p-8 lg:p-10">
					<p className="section-label">Enbridge</p>
					<h1 className="mt-4 font-display text-5xl leading-[0.96] text-pearl">
						{title}
					</h1>
					<p className="mt-5 max-w-md text-base leading-7 text-smoke">
						{isLogin
							? "Log in to reach your dashboard, task list, habits, and focus sessions."
							: "Set up your student productivity workspace and start with the MVP flow."}
					</p>
					<p className="mt-8 text-sm text-smoke">
						Auth submits to the backend endpoints in the README and
						uses JSON access/refresh tokens returned by the API.
					</p>

					<form className="mt-8 space-y-5" onSubmit={handleSubmit}>
						<div>
							<label className="text-sm text-smoke">Email</label>
							<input
								className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none ring-0 placeholder:text-white/25 focus:border-white/20"
								placeholder="you@example.com"
								value={email}
								onChange={(event) =>
									setEmail(event.target.value)
								}
								autoComplete="email"
							/>
						</div>

						<div>
							<label className="text-sm text-smoke">
								Password
							</label>
							<input
								type="password"
								className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none ring-0 placeholder:text-white/25 focus:border-white/20"
								placeholder="••••••••"
								value={password}
								onChange={(event) =>
									setPassword(event.target.value)
								}
								autoComplete={
									isLogin
										? "current-password"
										: "new-password"
								}
							/>
						</div>

						{!isLogin ? (
							<div>
								<label className="text-sm text-smoke">
									Name
								</label>
								<input
									className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none ring-0 placeholder:text-white/25 focus:border-white/20"
									placeholder="Your name"
									value={name}
									onChange={(event) =>
										setName(event.target.value)
									}
									autoComplete="name"
								/>
							</div>
						) : null}

						<div className="flex flex-col items-center gap-4 pt-2">
							<a
								href={
									API_BASE_URL
										? `${API_BASE_URL}/auth/google`
										: "#"
								}
								onClick={(event) => {
									if (!API_BASE_URL) {
										event.preventDefault();
										setErrorMessage(
											API_CONFIGURATION_ERROR,
										);
									}
								}}
							>
								<img
									src="web_neutral_rd_na.svg"
									alt="Sign in with Google"
									className="h-12"
								/>
							</a>
							<button
								className="button-primary w-full"
								disabled={isSubmitting}
							>
								{isSubmitting
									? "Please wait..."
									: isLogin
										? "Log in"
										: "Register"}
							</button>
						</div>

						{errorMessage ? (
							<p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
								{errorMessage}
							</p>
						) : null}

						<Link
							to={isLogin ? "/register" : "/login"}
							className="block text-center text-sm text-smoke transition hover:text-pearl"
						>
							{isLogin
								? "Need an account? Register"
								: "Already have an account? Log in"}
						</Link>
					</form>
				</section>
			</div>
		</main>
	);
}
