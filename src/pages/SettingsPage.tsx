import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../lib/auth";
import {
	fetchNotificationSettings,
	updateCurrentUserProfile,
	updateNotificationSettings,
	type NotificationSettings,
} from "../lib/api";

function getBrowserTimezone() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	} catch {
		return "UTC";
	}
}

function normalizeReminderTime(value?: string | null) {
	return value ? value.slice(0, 5) : "09:00";
}

export function SettingsPage() {
	const { user, refreshUser } = useAuth();
	const [name, setName] = useState(user?.name ?? "");
	const [settings, setSettings] = useState<NotificationSettings>({
		push_enabled: true,
		email_enabled: false,
		reminder_time: "09:00",
		timezone: getBrowserTimezone(),
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [isSavingNotifications, setIsSavingNotifications] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		setName(user?.name ?? user?.display_name ?? user?.full_name ?? "");
	}, [user]);

	useEffect(() => {
		let mounted = true;

		async function loadSettings() {
			try {
				setIsLoading(true);
				setError("");
				const response = await fetchNotificationSettings();
				if (!mounted) return;

				setSettings({
					push_enabled: Boolean(response.push_enabled),
					email_enabled: Boolean(response.email_enabled),
					reminder_time: normalizeReminderTime(
						response.reminder_time ?? response.remainder,
					),
					timezone: response.timezone || getBrowserTimezone(),
				});
			} catch (loadError) {
				if (!mounted) return;
				setError(
					loadError instanceof Error
						? loadError.message
						: "Unable to load notification settings.",
				);
			} finally {
				if (mounted) {
					setIsLoading(false);
				}
			}
		}

		void loadSettings();

		return () => {
			mounted = false;
		};
	}, []);

	const profileEmail = useMemo(
		() => user?.email?.trim() || "Email unavailable",
		[user],
	);

	async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!name.trim()) {
			setError("Name cannot be empty.");
			return;
		}

		try {
			setIsSavingProfile(true);
			setError("");
			setMessage("");
			await updateCurrentUserProfile({ name: name.trim() });
			await refreshUser();
			setMessage("Profile saved.");
		} catch (saveError) {
			setError(
				saveError instanceof Error
					? saveError.message
					: "Unable to save profile.",
			);
		} finally {
			setIsSavingProfile(false);
		}
	}

	async function handleNotificationSubmit(
		event: FormEvent<HTMLFormElement>,
	) {
		event.preventDefault();

		try {
			setIsSavingNotifications(true);
			setError("");
			setMessage("");
			const response = await updateNotificationSettings({
				push_enabled: Boolean(settings.push_enabled),
				email_enabled: Boolean(settings.email_enabled),
				reminder_time: normalizeReminderTime(settings.reminder_time),
				timezone: settings.timezone || getBrowserTimezone(),
			});
			setSettings({
				push_enabled: Boolean(response.push_enabled),
				email_enabled: Boolean(response.email_enabled),
				reminder_time: normalizeReminderTime(
					response.reminder_time ?? response.remainder,
				),
				timezone: response.timezone || settings.timezone,
			});
			setMessage("Notification settings saved.");
		} catch (saveError) {
			setError(
				saveError instanceof Error
					? saveError.message
					: "Unable to save notification settings.",
			);
		} finally {
			setIsSavingNotifications(false);
		}
	}

	return (
		<AppLayout>
			<section className="space-y-6">
				<div className="glass-panel rounded-[2rem] p-8">
					<p className="section-label">Settings</p>
					<h1 className="mt-4 font-display text-5xl text-pearl">
						Profile and reminders
					</h1>
					<p className="mt-4 max-w-2xl text-smoke">
						Update the profile name and the notification settings
						stored by the backend.
					</p>
				</div>

				{error ? (
					<div className="rounded-[1.5rem] border border-amber/20 bg-amber/10 p-4 text-sm text-pearl">
						{error}
					</div>
				) : null}

				{message ? (
					<div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
						{message}
					</div>
				) : null}

				<div className="space-y-6">
					<form
						onSubmit={handleProfileSubmit}
						className="glass-panel rounded-[2rem] p-6"
					>
						<p className="section-label">Profile</p>
						<div className="mt-6 space-y-4">
							<div>
								<label className="text-sm text-smoke">
									Name
								</label>
								<input
									className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
									value={name}
									onChange={(event) =>
										setName(event.target.value)
									}
									disabled={isSavingProfile}
								/>
							</div>

							<div>
								<label className="text-sm text-smoke">
									Email
								</label>
								<input
									className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-smoke outline-none"
									value={profileEmail}
									disabled
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={isSavingProfile || !name.trim()}
							className="mt-6 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 px-5 py-3 text-sm font-medium text-pearl transition hover:from-white/30 hover:to-white/20 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSavingProfile ? "Saving..." : "Save profile"}
						</button>
					</form>

					<form
						onSubmit={handleNotificationSubmit}
						className="glass-panel rounded-[2rem] p-6"
					>
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="section-label">
									Notifications
								</p>
								<p className="mt-3 text-sm text-smoke">
									{isLoading
										? "Loading saved settings..."
										: "Daily reminder preferences"}
								</p>
							</div>
						</div>

						<div className="mt-6 space-y-4">
							<label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
								<span className="text-sm text-pearl">
									Push reminders
								</span>
								<input
									type="checkbox"
									checked={Boolean(settings.push_enabled)}
									onChange={(event) =>
										setSettings((current) => ({
											...current,
											push_enabled:
												event.target.checked,
										}))
									}
								/>
							</label>

							<label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
								<span className="text-sm text-pearl">
									Email reminders
								</span>
								<input
									type="checkbox"
									checked={Boolean(settings.email_enabled)}
									onChange={(event) =>
										setSettings((current) => ({
											...current,
											email_enabled:
												event.target.checked,
										}))
									}
								/>
							</label>

							<div>
								<label className="text-sm text-smoke">
									Reminder time
								</label>
								<input
									type="time"
									className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none focus:border-white/20"
									value={normalizeReminderTime(
										settings.reminder_time,
									)}
									onChange={(event) =>
										setSettings((current) => ({
											...current,
											reminder_time:
												event.target.value,
										}))
									}
								/>
							</div>

							<div>
								<label className="text-sm text-smoke">
									Timezone
								</label>
								<input
									className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-pearl outline-none placeholder:text-white/25 focus:border-white/20"
									value={
										settings.timezone ||
										getBrowserTimezone()
									}
									onChange={(event) =>
										setSettings((current) => ({
											...current,
											timezone: event.target.value,
										}))
									}
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={isSavingNotifications || isLoading}
							className="mt-6 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 px-5 py-3 text-sm font-medium text-pearl transition hover:from-white/30 hover:to-white/20 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSavingNotifications
								? "Saving..."
								: "Save notifications"}
						</button>
					</form>
				</div>
			</section>
		</AppLayout>
	);
}
