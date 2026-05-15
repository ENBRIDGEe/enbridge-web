const API_BASE_URL = "http://localhost:8000";
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
