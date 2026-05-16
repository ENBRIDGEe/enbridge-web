import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	recordFocusSession,
	enqueueFocusSession,
	flushFocusSessionQueue,
} from "./api";

type PomodoroState = {
	duration: number; // seconds
	remaining: number; // seconds
	running: boolean;
	endTime?: number | null; // timestamp ms
	sessions: number; // completed sessions
};

type PomodoroContextValue = PomodoroState & {
	start: (minutes: number) => void;
	pause: () => void;
	resume: () => void;
	reset: (minutes?: number) => void;
	setDurationMinutes: (minutes: number) => void;
	resetSessions: () => void;
};

const STORAGE_KEY = "pomodoro_state";
const SESSIONS_KEY = "pomodoro_sessions";

const defaultMinutes = 25;

const PomodoroContext = createContext<PomodoroContextValue | undefined>(
	undefined,
);

function loadState(): PomodoroState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const sessionsRaw = localStorage.getItem(SESSIONS_KEY);
		const sessions = sessionsRaw ? parseInt(sessionsRaw, 10) : 0;
		if (!raw) {
			return {
				duration: defaultMinutes * 60,
				remaining: defaultMinutes * 60,
				running: false,
				endTime: null,
				sessions,
			};
		}
		const parsed = JSON.parse(raw);
		return {
			duration: parsed.duration ?? defaultMinutes * 60,
			remaining: parsed.remaining ?? defaultMinutes * 60,
			running: parsed.running ?? false,
			endTime: parsed.endTime ?? null,
			sessions,
		};
	} catch (e) {
		return {
			duration: defaultMinutes * 60,
			remaining: defaultMinutes * 60,
			running: false,
			endTime: null,
			sessions: 0,
		};
	}
}

function saveState(state: PomodoroState) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		localStorage.setItem(SESSIONS_KEY, String(state.sessions));
		if (typeof BroadcastChannel !== "undefined") {
			const bc = new BroadcastChannel("pomodoro");
			bc.postMessage(state);
			bc.close();
		}
	} catch (e) {
		// ignore
	}
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<PomodoroState>(() => loadState());
	const intervalRef = useRef<number | null>(null);
	const justFinishedRef = useRef(false);
	const lastPauseRecordedRef = useRef<{ remaining: number } | null>(null);
	const pauseTimeoutRef = useRef<number | null>(null);

	const tick = useCallback(() => {
		setState((prev) => {
			if (!prev.running || !prev.endTime) return prev;
			const now = Date.now();
			const remainingMs = Math.max(0, prev.endTime - now);
			const remaining = Math.ceil(remainingMs / 1000);
			const running = remaining > 0;

			// Increment session counter when timer just finished
			let sessions = prev.sessions;
			if (
				running === false &&
				prev.running === true &&
				!justFinishedRef.current
			) {
				sessions = prev.sessions + 1;
				justFinishedRef.current = true;
			}

			const next: PomodoroState = {
				...prev,
				remaining,
				running,
				endTime: running ? prev.endTime : null,
				sessions,
			};
			saveState(next);
			return next;
		});
	}, []);

	useEffect(() => {
		if (intervalRef.current) {
			window.clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		intervalRef.current = window.setInterval(() => tick(), 1000);
		return () => {
			if (intervalRef.current) window.clearInterval(intervalRef.current!);
		};
	}, [tick]);

	// sync from storage/broadcast
	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY && e.newValue) {
				try {
					const parsed = JSON.parse(e.newValue);
					setState((prev) => ({ ...prev, ...parsed }));
				} catch (err) {}
			}
		};
		window.addEventListener("storage", onStorage);
		let bc: BroadcastChannel | null = null;
		if (typeof BroadcastChannel !== "undefined") {
			bc = new BroadcastChannel("pomodoro");
			bc.onmessage = (ev) => {
				const parsed = ev.data;
				if (parsed) setState((prev) => ({ ...prev, ...parsed }));
			};
		}
		return () => {
			window.removeEventListener("storage", onStorage);
			if (bc) bc.close();
		};
	}, []);

	// Try flushing any queued sessions on mount and when connection returns
	useEffect(() => {
		void flushFocusSessionQueue();

		function onOnline() {
			void flushFocusSessionQueue();
		}

		window.addEventListener("online", onOnline);
		return () => window.removeEventListener("online", onOnline);
	}, []);

	const start = useCallback((minutes: number) => {
		const duration = Math.max(1, Math.round(minutes)) * 60;
		const endTime = Date.now() + duration * 1000;
		setState((prev) => {
			const next: PomodoroState = {
				duration,
				remaining: duration,
				running: true,
				endTime,
				sessions: prev.sessions ?? 0,
			};
			saveState(next);
			return next;
		});
		lastPauseRecordedRef.current = null;
		if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
	}, []);

	const recordPartialSession = useCallback(
		(duration: number, remaining: number) => {
			const timeSpentSeconds = duration - remaining;
			if (timeSpentSeconds <= 0) return; // Don't record if no time spent

			// Round to nearest minute (minimum 1 minute)
			const timeSpentMinutes = Math.max(
				1,
				Math.round(timeSpentSeconds / 60),
			);
			const now = new Date();
			const completedAt = now.toISOString();
			const date = now.toISOString().split("T")[0];

			// Record partial time to backend (rounded minutes)
			recordFocusSession(timeSpentMinutes, completedAt, date)
				.then(() => {
					try {
						localStorage.setItem(
							"pomodoro_last_update",
							String(Date.now()),
						);
					} catch (e) {}
				})
				.catch((err) => {
					console.error(
						"Failed to record partial focus session:",
						err,
					);
					// enqueue for retry later
					enqueueFocusSession({
						sessionDurationMinutes: timeSpentMinutes,
						completedAt,
						date,
						attempts: 0,
					});
					try {
						localStorage.setItem(
							"pomodoro_last_update",
							String(Date.now()),
						);
					} catch (e) {}
				});
		},
		[],
	);

	// Record completed sessions (when timer naturally reaches 0)
	const previousSessionsRef = useRef(state.sessions);
	useEffect(() => {
		if (state.sessions > previousSessionsRef.current) {
			const newSessions = state.sessions - previousSessionsRef.current;
			const sessionDurationMinutes = Math.max(
				1,
				Math.round(state.duration / 60),
			);
			for (let i = 0; i < newSessions; i++) {
				const now = new Date();
				const completedAt = now.toISOString();
				const date = now.toISOString().split("T")[0];
				recordFocusSession(sessionDurationMinutes, completedAt, date)
					.then(() => {
						try {
							localStorage.setItem(
								"pomodoro_last_update",
								String(Date.now()),
							);
						} catch (e) {}
					})
					.catch((err) => {
						console.error(
							"Failed to record completed focus session:",
							err,
						);
						enqueueFocusSession({
							sessionDurationMinutes: sessionDurationMinutes,
							completedAt,
							date,
							attempts: 0,
						});
						try {
							localStorage.setItem(
								"pomodoro_last_update",
								String(Date.now()),
							);
						} catch (e) {}
					});
			}

			previousSessionsRef.current = state.sessions;
		}
	}, [state.sessions, state.duration]);

	const pause = useCallback(() => {
		setState((prev) => {
			if (!prev.running) return prev;
			const now = Date.now();
			const remaining = prev.endTime
				? Math.max(0, Math.ceil((prev.endTime - now) / 1000))
				: prev.remaining;

			// Record partial session when paused
			if (
				!lastPauseRecordedRef.current ||
				lastPauseRecordedRef.current.remaining !== remaining
			) {
				recordPartialSession(prev.duration, remaining);
				lastPauseRecordedRef.current = { remaining };
			}

			const next: PomodoroState = {
				...prev,
				running: false,
				remaining,
				endTime: null,
			};
			saveState(next);
			return next;
		});
	}, [recordPartialSession]);

	const resume = useCallback(() => {
		setState((prev) => {
			if (prev.running) return prev;
			const endTime = Date.now() + prev.remaining * 1000;
			const next: PomodoroState = { ...prev, running: true, endTime };
			saveState(next);
			return next;
		});
	}, []);

	const reset = useCallback((minutes?: number) => {
		const mins = minutes ?? Math.round(defaultMinutes);
		const duration = Math.max(1, mins) * 60;
		setState((prev) => {
			const next: PomodoroState = {
				duration,
				remaining: duration,
				running: false,
				endTime: null,
				sessions: prev.sessions ?? 0,
			};
			saveState(next);
			return next;
		});
		lastPauseRecordedRef.current = null;
		if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
	}, []);

	const setDurationMinutes = useCallback((minutes: number) => {
		setState((prev) => {
			const duration = Math.max(1, Math.round(minutes)) * 60;
			const next: PomodoroState = {
				...prev,
				duration,
				remaining: duration,
				running: false,
				endTime: null,
			};
			saveState(next);
			return next;
		});
		lastPauseRecordedRef.current = null;
		if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
	}, []);

	const resetSessions = useCallback(() => {
		setState((prev) => {
			const next: PomodoroState = { ...prev, sessions: 0 };
			saveState(next);
			return next;
		});
		justFinishedRef.current = false;
		lastPauseRecordedRef.current = null;
	}, []);

	// Reset justFinishedRef when timer restarts
	useEffect(() => {
		if (state.running) {
			justFinishedRef.current = false;
		}
	}, [state.running]);

	const value: PomodoroContextValue = {
		...state,
		start,
		pause,
		resume,
		reset,
		setDurationMinutes,
		resetSessions,
	};

	return (
		<PomodoroContext.Provider value={value}>
			{children}
		</PomodoroContext.Provider>
	);
}

export function usePomodoro() {
	const ctx = useContext(PomodoroContext);
	if (!ctx)
		throw new Error("usePomodoro must be used within PomodoroProvider");
	return ctx;
}

export default PomodoroProvider;
