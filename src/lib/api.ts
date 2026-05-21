import type { TaskRecord } from "./taskTypes";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const fallbackApiUrl = import.meta.env.DEV
	? "http://localhost:8000"
	: "https://bn8gke3pw4.execute-api.us-east-1.amazonaws.com/prod";

export const API_BASE_URL = (configuredApiUrl || fallbackApiUrl).replace(
	/\/+$/,
	"",
);
export const API_CONFIGURATION_ERROR =
	"Missing VITE_API_URL. Set it in your deployment environment to the backend API origin.";
const ACCESS_TOKEN_KEY = "enbridge_access_token";
const REFRESH_TOKEN_KEY = "enbridge_refresh_token";

export type AuthTokenResponse = {
	access_token?: string;
	token_type?: string;
	auth_method?: "password" | "google" | "refresh";
	message?: string;
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
	user_email?: string;
	email_address?: string;
	is_active?: boolean;
	is_admin?: boolean;
	created_at?: string;
	updated_at?: string;
	productivity_score?: number;
	streak_count?: number;
};

export type GoalRecord = {
	id?: string;
	title?: string;
	description?: string;
	category?: string;
	target_date?: string;
	deadline?: string;
	status?: string;
	progress_percentage?: number;
};

export type GoalCreatePayload = {
	title: string;
	description?: string;
	category?: string;
	target_date?: string;
	deadline?: string;
	status?: string;
	progress_percentage?: number;
};

export type MilestoneRecord = {
	id?: string;
	goal_id?: string;
	title?: string;
	description?: string;
	target_date?: string;
	order_index?: number;
	completed?: boolean;
};

export type MilestoneCreatePayload = {
	goal_id: string;
	title?: string;
	description?: string;
	target_date: string;
	order_index: number;
	completed?: boolean;
};

export type TaskCreatePayload = {
	title?: string;
	milestone_id?: string;
	due_date?: string;
	completed?: boolean;
};

export type TaskUpdatePayload = Partial<TaskCreatePayload>;

export type NotificationSettings = {
	push_enabled?: boolean;
	email_enabled?: boolean;
	reminder_time?: string | null;
	remainder?: string | null;
	timezone?: string;
};

export type NotificationUpdatePayload = Partial<NotificationSettings>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return Boolean(value) && typeof value === "object";
}

function mergeHeaders(body?: BodyInit | null, overrideHeaders?: HeadersInit) {
	const headers = getHeaders(body);

	if (overrideHeaders) {
		new Headers(overrideHeaders).forEach((value, key) => {
			headers.set(key, value);
		});
	}

	return headers;
}

type RequestOptions = RequestInit & {
	auth?: boolean;
	timeoutMs?: number;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
const TASK_REQUEST_TIMEOUT_MS = 60000;
const inFlightGetRequests = new Map<string, Promise<unknown>>();

function getHeaders(body?: BodyInit | null) {
	const headers = new Headers();

	if (typeof body === "string") {
		headers.set("Content-Type", "application/json");
	}

	return headers;
}

export function getAccessToken() {
	return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
	window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
	window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
	return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
	window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearRefreshToken() {
	window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearAllTokens() {
	clearAccessToken();
	clearRefreshToken();
}

function buildApiUrl(path: string) {
	if (!API_BASE_URL) {
		throw new Error(API_CONFIGURATION_ERROR);
	}

	return `${API_BASE_URL}${path}`;
}

export async function apiRequest<T>(
	path: string,
	options: RequestOptions = {},
) {
	const method = (options.method ?? "GET").toUpperCase();
	const canDedupe = method === "GET" && !options.body;
	const requestUrl = buildApiUrl(path);
	const requestKey = `${method}:${requestUrl}`;

	if (canDedupe) {
		const existingRequest = inFlightGetRequests.get(requestKey);
		if (existingRequest) {
			return existingRequest as Promise<T>;
		}

		const request = performApiRequest<T>(path, options).finally(() => {
			inFlightGetRequests.delete(requestKey);
		});
		inFlightGetRequests.set(requestKey, request);
		return request;
	}

	return performApiRequest<T>(path, options);
}

async function performApiRequest<T>(
	path: string,
	options: RequestOptions = {},
) {
	const controller = new AbortController();
	const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const { timeoutMs: _timeoutMs, ...fetchOptions } = options;
		// Prepare headers and include Authorization when requested
		const requestHeaders = mergeHeaders(options.body ?? null, options.headers);
		if (options.auth) {
			const at = getAccessToken();
			if (at) requestHeaders.set("Authorization", `Bearer ${at}`);
		}

		let response = await fetch(buildApiUrl(path), {
			...fetchOptions,
			signal: controller.signal,
			credentials: "include",
			headers: requestHeaders,
		});

		// If unauthorized and auth was required, attempt a token refresh and retry once
		if (response.status === 401 && options.auth) {
			try {
				await refreshToken();
				const newAt = getAccessToken();
				if (newAt) {
					const retryHeaders = mergeHeaders(options.body ?? null, options.headers);
					retryHeaders.set("Authorization", `Bearer ${newAt}`);
					response = await fetch(buildApiUrl(path), {
						...fetchOptions,
						signal: controller.signal,
						credentials: "include",
						headers: retryHeaders,
					});
				}
			} catch (e) {
				// refresh failed - fall through to error handling
			}
		}

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				errorBody || `Request failed with status ${response.status}`,
			);
		}

		if (response.status === 204) {
			return undefined as T;
		}

		const contentType = response.headers.get("content-type") ?? "";
		if (contentType.includes("application/json")) {
			return response.json() as Promise<T>;
		}

		const text = await response.text();
		return (text || undefined) as T;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(
				`Request timeout (${Math.round(timeoutMs / 1000)}s) for ${path}`,
			);
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

export async function loginWithPassword(email: string, password: string) {
	const body = new URLSearchParams();
	body.set("username", email);
	body.set("password", password);

	const response = await fetch(buildApiUrl("/token"), {
		method: "POST",
		body,
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			errorBody || `Request failed with status ${response.status}`,
		);
	}

	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		const json = (await response.json()) as AuthTokenResponse & { refresh_token?: string };
		if (json.access_token) setAccessToken(json.access_token);
		if ((json as any).refresh_token) setRefreshToken((json as any).refresh_token);
		return json as Promise<AuthTokenResponse>;
	}

	throw new Error(
		"Login did not return an API response. Check that VITE_API_URL points to the backend, not the frontend.",
	);
}

export async function registerUser(payload: {
	name: string;
	email: string;
	password: string;
}) {
	const res = await apiRequest<AuthTokenResponse>("/register", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	try {
		if (res && typeof res === "object") {
			const r = res as unknown as AuthTokenResponse & { refresh_token?: string };
			if (r.access_token) setAccessToken(r.access_token);
			if ((r as any).refresh_token) setRefreshToken((r as any).refresh_token);
		}
	} catch {
		// ignore
	}
	return res;
}

export async function refreshToken() {
	const refresh = getRefreshToken();
	if (!refresh) throw new Error("No refresh token available");

	const response = await fetch(buildApiUrl("/auth/refresh"), {
		method: "POST",
		headers: new Headers({ "Content-Type": "application/json" }),
		body: JSON.stringify({ refresh_token: refresh }),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(body || `Refresh failed with status ${response.status}`);
	}

	const data = (await response.json()) as AuthTokenResponse & { refresh_token?: string };
	if (data.access_token) setAccessToken(data.access_token);
	if ((data as any).refresh_token) setRefreshToken((data as any).refresh_token);
	return data;
}

function unwrapUserProfile(response: unknown): UserProfile {
	if (!isRecord(response)) {
		throw new Error("Current user response did not include a profile.");
	}

	const data = response.data;
	const nestedData = isRecord(data) ? data.data : undefined;
	const candidates = [
		response.user,
		isRecord(data) ? data.user : undefined,
		isRecord(nestedData) ? nestedData.user : undefined,
		data,
		response,
	];

	for (const candidate of candidates) {
		if (!isRecord(candidate)) {
			continue;
		}

		if (
			"id" in candidate ||
			"email" in candidate ||
			"user_email" in candidate ||
			"email_address" in candidate ||
			"name" in candidate ||
			"username" in candidate
		) {
			return normalizeUserProfile(candidate as UserProfile);
		}
	}

	throw new Error("Current user response did not include a profile.");
}

function normalizeUserProfile(profile: UserProfile): UserProfile {
	return {
		...profile,
		email:
			profile.email ??
			profile.user_email ??
			profile.email_address ??
			undefined,
	};
}

function mergeUserProfiles(
	primary: UserProfile,
	secondary?: UserProfile,
): UserProfile {
	if (!secondary) {
		return primary;
	}

	return {
		...secondary,
		...primary,
		email: primary.email ?? secondary.email,
	};
}

export async function fetchCurrentUser() {
	try {
		const profile = await fetchCurrentUserProfile();
		if (profile.email) {
			return profile;
		}

		const publicProfile = await fetchPublicProfile().catch(() => undefined);
		return mergeUserProfiles(profile, publicProfile);
	} catch {
		const response = await apiRequest<unknown>("/users/auth", {
			method: "GET",
			auth: true,
		});

		const profile = unwrapUserProfile(response);
		if (profile.email) {
			return profile;
		}

		const publicProfile = await fetchPublicProfile().catch(() => undefined);
		return mergeUserProfiles(profile, publicProfile);
	}
}

export async function fetchCurrentUserProfile() {
	const response = await apiRequest<unknown>("/users/me/", {
		method: "GET",
		auth: true,
	});

	return unwrapUserProfile(response);
}

export async function fetchPublicProfile() {
	const response = await apiRequest<unknown>("/users/me/public", {
		method: "GET",
		auth: true,
	});

	return unwrapUserProfile(response);
}

export async function updateCurrentUserProfile(payload: { name: string }) {
	const response = await apiRequest<unknown>("/users/me", {
		method: "PATCH",
		body: JSON.stringify(payload),
		auth: true,
	});

	return unwrapUserProfile(response);
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

export async function createTask(payload: TaskCreatePayload) {
	return apiRequest<TaskRecord>("/tasks", {
		method: "POST",
		body: JSON.stringify(payload),
		auth: true,
	});
}

export async function updateTask(taskId: string, payload: TaskUpdatePayload) {
	return apiRequest<TaskRecord>(`/tasks/${taskId}`, {
		method: "PATCH",
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
		timeoutMs: TASK_REQUEST_TIMEOUT_MS,
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
	return updateTask(taskId, { completed });
}

export async function fetchNotificationSettings() {
	return apiRequest<NotificationSettings>("/notifications/settings", {
		method: "GET",
		auth: true,
	});
}

export async function updateNotificationSettings(
	payload: NotificationUpdatePayload,
) {
	return apiRequest<NotificationSettings>("/notifications/settings", {
		method: "PATCH",
		body: JSON.stringify(payload),
		auth: true,
	});
}

export async function deleteTask(taskId: string) {
	return apiRequest<{ message?: string }>(`/tasks/${taskId}`, {
		method: "DELETE",
		auth: true,
	});
}

export async function getGoal(goalId: string) {
	return apiRequest<GoalRecord>(`/goals/${goalId}`, {
		method: "GET",
		auth: true,
	});
}

export async function updateGoal(
	goalId: string,
	payload: Partial<GoalCreatePayload>,
) {
	return apiRequest<GoalRecord>(`/goals/${goalId}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
		auth: true,
	});
}

export async function deleteGoal(goalId: string) {
	return apiRequest<{ message?: string }>(`/goals/${goalId}`, {
		method: "DELETE",
		auth: true,
	});
}

export async function deleteMilestone(milestoneId: string) {
	return apiRequest<{ message?: string }>(`/milestones/${milestoneId}`, {
		method: "DELETE",
		auth: true,
	});
}

export async function logout() {
	try {
		await apiRequest<{ message?: string }>("/logout", {
			method: "POST",
			auth: true,
		});
	} catch (error) {
		console.error("Logout request failed:", error);
	} finally {
		// Always clear local tokens regardless of API success
		clearAllTokens();
	}
}
