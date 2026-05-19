# Enbridge Web

This repository contains the Enbridge frontend: a React 18 + Vite + TypeScript app that talks to the FastAPI backend through cookie-based auth.

The backend README and OpenAPI schema are the source of truth for request and response shapes. This repo keeps the client aligned with those schemas and the app shell used for the dashboard, tasks, habits, focus, and settings pages.

## Quick Start

```bash
npm install
npm run dev
```

The dev server runs at:

```text
http://localhost:5173
```

## Environment

Set the API origin for the frontend at build time:

```env
VITE_API_URL=http://localhost:8000
```

For production, point `VITE_API_URL` at the deployed backend origin.

## Backend Contract

The frontend expects the backend to support cookie-based auth and these main endpoints:

- `POST /register`
- `POST /token`
- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/refresh`
- `POST /logout`
- `GET /users/me`
- `GET /users/me/public`
- `GET /users/auth`
- `GET /goals`
- `POST /goals`
- `GET /goals/{goal_id}`
- `PATCH /goals/{goal_id}`
- `DELETE /goals/{goal_id}`
- `POST /goals/{goal_id}/activity`
- `GET /goals/{goal_id}/activity`
- `DELETE /goals/{goal_id}/activity`
- `GET /milestones/goal/{goal_id}`
- `POST /milestones`
- `DELETE /milestones/{milestone_id}`
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/{task_id}`
- `DELETE /tasks/{task_id}`
- `GET /notifications/settings`
- `PATCH /notifications/settings`
- `POST /analytics/focus-sessions`
- `GET /analytics/focus-time`

## Data Shapes Used Here

- Auth token responses include `auth_method` alongside `access_token` and `token_type`.
- User responses may include `id`, `name`, `email`, `is_active`, `is_admin`, `created_at`, and `updated_at`.
- Goal, task, milestone, notification, and focus-time payloads are handled through the shared API client in `src/lib/api.ts`.

## Notes

- Browser requests must use `credentials: "include"` so the auth cookies are sent.
- The app uses SPA routing, so deployed hosts need a rewrite to `index.html` for deep links and refreshes.
- The backend may use SQLite by default, but that does not change the frontend contract.
