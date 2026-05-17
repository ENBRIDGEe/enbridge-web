import type { TaskRecord } from "./taskTypes";

export const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = "enbridge_access_token";

export type AuthTokenResponse = {
	access_token: string;
	token_type: string;
};

export type UserProfile = {
	id?: string;
	name?: string;
	username?: string;
	display_name?: string;
	full_name?: string;
	first_name?: string;
	last_name?: string;
	email?: string;
	productivity_score?: number;
	streak_count?: number;
};

export type GoalRecord = {
	id?: string;
	title?: string;
	category?: string;
	deadline?: string;
	status?: string;
};

export type GoalCreatePayload = {
	title: string;
	category: string;
	deadline: string;
	status?: string;
};

export type MilestoneRecord = {
	id?: string;
	goal_id?: string;
	target_date?: string;
	order_index?: number;
};

export type MilestoneCreatePayload = {
	goal_id: string;
	target_date: string;
	order_index: number;
};

type RequestOptions = RequestInit & {
	auth?: boolean;
};

function getHeaders(body?: BodyInit | null, auth = false) {
	const headers = new Headers();

	if (body && !(body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	if (auth) {
		const token = getAccessToken();
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
	}

	return headers;
}

export function getAccessToken() {
	return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
	window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
	window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(
	path: string,
	options: RequestOptions = {},
) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		credentials: "include", // Send cookies with every request
		headers: {
			...Object.fromEntries(
				getHeaders(options.body ?? null, options.auth).entries(),
			),
			...(options.headers ?? {}),
		},
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			errorBody || `Request failed with status ${response.status}`,
		);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export async function loginWithPassword(email: string, password: string) {
	const body = new URLSearchParams();
	body.set("username", email);
	body.set("password", password);

	return apiRequest<AuthTokenResponse>("/token", {
		method: "POST",
		body,
	});
}

export async function registerUser(payload: {
	name: string;
	email: string;
	password: string;
}) {
	return apiRequest<AuthTokenResponse>("/register", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function fetchCurrentUser() {
	const response = await apiRequest<
		| {
				message?: string;
				user?: UserProfile;
		  }
		| UserProfile
	>("/users/auth", {
		method: "GET",
		auth: true,
	});

	// Handle both nested and flat response shapes
	if (response && "user" in response && response.user) {
		return response.user;
	}

	return response as UserProfile;
}

export async function fetchPublicProfile() {
	return apiRequest<UserProfile>("/users/auth/public", {
		method: "GET",
	});
}

type GoalListResponse =
	| GoalRecord[]
	| {
			goals?: GoalRecord[];
			data?: GoalRecord[];
			items?: GoalRecord[];
			results?: GoalRecord[];
	  };

export async function fetchGoals() {
	const response = await apiRequest<GoalListResponse>("/goals", {
		method: "GET",
		auth: true,
	});

	if (Array.isArray(response)) {
		return response;
	}

	return (
		response.goals ??
		response.data ??
		response.items ??
		response.results ??
		[]
	);
}

export async function createGoal(payload: GoalCreatePayload) {
	return apiRequest<GoalRecord>("/goals", {
		method: "POST",
		body: JSON.stringify(payload),
		auth: true,
	});
}

export async function fetchGoalMilestones(goalId: string) {
	return apiRequest<MilestoneRecord[]>(`/milestones/goal/${goalId}`, {
		method: "GET",
		auth: true,
	});
}

export async function createMilestone(payload: MilestoneCreatePayload) {
	return apiRequest<MilestoneRecord>("/milestones", {
		method: "POST",
		body: JSON.stringify(payload),
		auth: true,
	});
}

export type GoalActivityResponse = {
	dates: string[];
	count: number;
};

export async function addGoalActivity(goalId: string, activityDate: string) {
	return apiRequest<unknown>(`/goals/${goalId}/activity`, {
		method: "POST",
		body: JSON.stringify({ goal_id: goalId, activity_date: activityDate }),
		auth: true,
	});
}

export async function removeGoalActivity(goalId: string, activityDate: string) {
	return apiRequest<unknown>(`/goals/${goalId}/activity`, {
		method: "DELETE",
		body: JSON.stringify({ goal_id: goalId, activity_date: activityDate }),
		auth: true,
	});
}

export async function fetchGoalActivity(
	goalId: string,
	start?: string,
	end?: string,
) {
	const params = new URLSearchParams();
	if (start) params.set("start", start);
	if (end) params.set("end", end);

	const query = params.toString();
	const url = `/goals/${goalId}/activity${query ? `?${query}` : ""}`;

	return apiRequest<GoalActivityResponse>(url, {
		method: "GET",
		auth: true,
	});
}

type TaskListResponse =
	| TaskRecord[]
	| {
			tasks?: TaskRecord[];
			data?: TaskRecord[];
			items?: TaskRecord[];
			results?: TaskRecord[];
	  };

export async function fetchTasks() {
	const response = await apiRequest<TaskListResponse>("/tasks", {
		method: "GET",
		auth: true,
	});

	if (Array.isArray(response)) {
		return response;
	}

	return (
		response.tasks ??
		response.data ??
		response.items ??
		response.results ??
		[]
	);
}

// Analytics API

export type FocusSessionResponse = {
	message: string;
	session_id: string;
	daily_total_minutes: number;
};

export type FocusTimeData = {
	date: string;
	total_minutes: number;
	sessions_count: number;
	avg_session_minutes: number;
	focus_time_display: string;
};

export async function recordFocusSession(
	sessionDurationMinutes: number,
	completedAt: string,
	date: string,
) {
	return apiRequest<FocusSessionResponse>("/analytics/focus-sessions", {
		method: "POST",
		body: JSON.stringify({
			session_duration_minutes: sessionDurationMinutes,
			completed_at: completedAt,
			date,
		}),
		auth: true,
	});
}

// Queue failed focus-session records locally and flush later
const QUEUE_KEY = "pomodoro_queue";

type QueuedFocusSession = {
	sessionDurationMinutes: number;
	completedAt: string;
	date: string;
	attempts?: number;
	lastAttempt?: number;
};

export function enqueueFocusSession(q: QueuedFocusSession) {
	try {
		const raw = localStorage.getItem(QUEUE_KEY);
		const arr: QueuedFocusSession[] = raw ? JSON.parse(raw) : [];
		arr.push(q);
		localStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
	} catch (e) {
		// ignore
	}
}

export async function flushFocusSessionQueue() {
	try {
		const raw = localStorage.getItem(QUEUE_KEY);
		if (!raw) return;
		const arr: QueuedFocusSession[] = JSON.parse(raw) || [];
		if (!arr.length) return;

		const remaining: QueuedFocusSession[] = [];

		for (const item of arr) {
			try {
				await recordFocusSession(
					item.sessionDurationMinutes,
					item.completedAt,
					item.date,
				);
				// success -> continue
			} catch (err) {
				// failed -> increment attempts and keep
				const next: QueuedFocusSession = {
					...item,
					attempts: (item.attempts || 0) + 1,
					lastAttempt: Date.now(),
				};
				// Give up after 5 attempts
				if ((next.attempts || 0) < 5) remaining.push(next);
			}
		}

		if (remaining.length) {
			localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
		} else {
			localStorage.removeItem(QUEUE_KEY);
		}
	} catch (e) {
		// ignore
	}
}

export async function fetchFocusTime(
	date?: string,
	range?: "day" | "week" | "month",
) {
	const params = new URLSearchParams();
	if (date) {
		params.set("date", date);
	}
	if (range) {
		params.set("range", range);
	}

	const queryString = params.toString();
	const url = `/analytics/focus-time${queryString ? `?${queryString}` : ""}`;

	return apiRequest<FocusTimeData>(url, {
		method: "GET",
		auth: true,
	});
}

export async function updateTaskCompletion(taskId: string, completed: boolean) {
	return apiRequest<unknown>(`/tasks/${taskId}`, {
		method: "PATCH",
		body: JSON.stringify({ completed }),
		auth: true,
	});
}
