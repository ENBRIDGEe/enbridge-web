# Enbridge Web Project - Complete Context & Progress

**Last Updated:** May 16, 2026  
**Current Status:** All features implemented and passing build validation (60 modules, 221kB JS)

---

## 1. Project Overview

**Repository:** enbridge-web  
**Tech Stack:**

- Frontend: React 18 + TypeScript + Vite 6.4.2
- Styling: Tailwind CSS with custom tokens (glass-panel, border-glow, text-pearl, text-smoke)
- Routing: React Router v6 with ProtectedRoute
- Backend: FastAPI at http://localhost:8000 with cookie-based JWT auth
- Dev Server: http://localhost:5173

**Purpose:** Productivity dashboard with Pomodoro timer, task tracking, analytics, and daily review.

---

## 2. Completed Features

### ✅ Authentication & User Context

- `fetchCurrentUser()` — Nested response handling (data.data.user)
- Displays actual user name "Sampraad Das"
- Time-based greeting ("Good morning/afternoon/evening") via `getTimeBasedGreeting()`
- HttpOnly JWT cookies for secure sessions

### ✅ Layout & Navigation

- Reusable Sidebar component with navigation links
- AppLayout wrapper for authenticated routes
- ProtectedRoute wrapper for /app/\* paths

### ✅ Pomodoro Timer (`src/lib/pomodoro.tsx`)

- Global timer state: 25/60/120 min durations
- `PomodoroProvider` with context API
- Tick mechanism: increments sessions on natural completion
- **Analytics Recording:**
    - `recordPartialSession(duration, remaining)` — computes timeSpentSeconds, rounds to minutes (min=1), POSTs to backend
    - `recordFocusSession(sessionDurationMinutes, completedAt, date)` → POST /analytics/focus-sessions
    - On success: writes `pomodoro_last_update` to localStorage, triggers storage event, increments session counter
    - On fail: enqueues to `pomodoro_queue` via `enqueueFocusSession()`
- **Queue & Retry:** `flushFocusSessionQueue()` retries up to 5 attempts with backoff (via attempts counter), removes on success
- **Cross-Tab Sync:** BroadcastChannel("pomodoro") and localStorage keys: pomodoro_state, pomodoro_sessions, pomodoro_queue, pomodoro_last_update

### ✅ Focus Time Analytics

- Dashboard shows dynamic focus_time_display from backend
- Fetches via `fetchFocusTime(date?, range?)` → GET /analytics/focus-time
- Partial session recordings trigger dashboard refetch via `pomodoro_last_update` storage event listener
- Tasks recorded as (sessionDurationMinutes, completedAt, date); backend stores to DB

### ✅ Task Management

- **Display & Sorting (`src/lib/taskDisplay.ts`):**
    - `normalizeTask(task, index)` → converts TaskRecord to DisplayTask
    - `sortDisplayTasks(tasks)` → sorts by status priority (pending=0, in-progress=1, missed=2, completed=3), then due date ASC, then title
    - DisplayTask shape: {id?, time, title, category, status (completed|in-progress|pending|missed), dueDate?}

- **Interactive UI (`src/components/dashboard/TimelineItem.tsx`):**
    - Clickable SVG tick circle replaces status badge
    - Filled/glowing when completed
    - Title gets line-through decoration
    - `onToggleCompletion(task)` callback

- **Backend Sync (`src/lib/api.ts`):**
    - `updateTaskCompletion(taskId, completed)` → PATCH /tasks/{taskId} with {completed: bool}
    - Optimistic UI update (set state first)
    - Fallback to `refreshTasks()` on error

- **Pages Implementing Sorting & Toggle:**
    - DashboardPage: Shows top 6 tasks, "Tasks completed" metric is dynamic
    - TasksPage: Full task list, same sorting + toggle logic

- **API Endpoints:**
    - GET /tasks — fetch all tasks
    - PATCH /tasks/{task_id} — update task completion (payload: {completed: bool})
    - POST /tasks — create new task

---

## 3. Key Implementation Files

### `src/lib/api.ts`

```typescript
// Analytics
recordFocusSession(sessionDurationMinutes, completedAt, date) → POST /analytics/focus-sessions
fetchFocusTime(date?, range?) → GET /analytics/focus-time

// Task Management
updateTaskCompletion(taskId, completed) → PATCH /tasks/{taskId} with {completed: bool}

// Queue & Retry (5-attempt limit with attempts counter for backoff)
enqueueFocusSession(q: QueuedFocusSession) → localStorage["pomodoro_queue"]
flushFocusSessionQueue() → retries each queued item up to 5 times, removes on success

// Helper
apiRequest(endpoint, options) — centralizer with credentials: 'include'
```

### `src/lib/pomodoro.tsx`

- PomodoroProvider context
- `recordPartialSession(duration, remaining)` — enqueues on fail, writes pomodoro_last_update to localStorage on success/fail
- `tick()` — increments session counter on natural completion
- Flush on mount + online event
- BroadcastChannel sync for cross-tab updates

### `src/lib/taskDisplay.ts` (NEW shared helpers)

- `normalizeTask(task, index)` — shapes TaskRecord to DisplayTask
- `sortDisplayTasks(tasks)` — applies status priority + due date + title sorting
- Type: DisplayTask

### `src/pages/DashboardPage.tsx`

- `refreshTasks()` — fetches /tasks, handles errors, respects isMounted guard
- `handleToggleTask(task)` — optimistic state update + PATCH sync with fallback refresh
- `displayedTasks = sortDisplayTasks(tasks.map(normalizeTask)).slice(0,6)`
- `dynamicDashboardMetrics` — "Tasks completed" metric shows live `${completedTaskCount} / ${liveTaskCount}`
- Storage event listener on "pomodoro_last_update" → refetches focus time on partial session record

### `src/pages/TasksPage.tsx`

- Same sorting + toggle logic as dashboard
- `loadTasks()` extracted to useCallback
- Full task list display

### `src/components/dashboard/TimelineItem.tsx`

- Clickable SVG tick circle
- Strike-through for completed tasks
- `onToggleCompletion(task)` callback

---

## 4. Data Flow & Persistence

### Focus Time Recording Flow

```
Pomodoro pause() → recordPartialSession(duration, remaining)
  ├─ Compute timeSpentSeconds, round to minutes (min=1)
  ├─ Call recordFocusSession(timeSpentMinutes, completedAt, date)
  ├─ POST /analytics/focus-sessions to backend
  │  ├─ On success: write pomodoro_last_update = now to localStorage
  │  │             emit storage event → DashboardPage refetches focus time
  │  │             increment session counter
  │  └─ On fail: enqueue to pomodoro_queue via enqueueFocusSession()
  │             write pomodoro_last_update = now anyway (for UI feedback)
  └─ Backend stores focus_time to DB; returned in GET /analytics/focus-time responses
```

### Task Toggle Flow

```
User clicks task circle
  ├─ Optimistic state update (set completed = !completed, update status)
  ├─ Call updateTaskCompletion(taskId, nextCompleted)
  │  ├─ PATCH /tasks/{taskId} with {completed: bool}
  │  └─ On fail: fallback to refreshTasks() (full fetch + resort + re-render)
  └─ On success: re-sort display (pending tasks with nearest due date first, completed at bottom)
```

### localStorage Keys (must remain consistent)

```
pomodoro_state: { selectedDuration, isRunning, timeRemaining, ... }
pomodoro_sessions: number (total completed sessions)
pomodoro_queue: QueuedFocusSession[] (retry buffer for failed POSTs)
pomodoro_last_update: timestamp string (triggers storage event on partial session record)
```

### BroadcastChannel

```
Channel name: "pomodoro"
Purpose: Cross-tab sync for timer state, session counter, queue flush events
```

---

## 5. API Endpoints (Backend)

### Authentication

- GET /me — returns {data: {user: {name, email, ...}}}
- Cookie-based JWT (HttpOnly), optional Authorization header

### Analytics

- POST /analytics/focus-sessions — {session_duration_minutes, completed_at, date}
- GET /analytics/focus-time?date=YYYY-MM-DD&range=day|week|month — returns {focus_time_display, ...}

### Tasks

- GET /tasks — returns [{id, title, time, category, status, dueDate, completed}, ...]
- PATCH /tasks/{task_id} — {completed: bool} — returns updated TaskRecord
- POST /tasks — {title, category, time, dueDate} — creates new task

---

## 6. Current Component State

### DashboardPage

- **Props:** None (authenticated via ProtectedRoute)
- **State:**
    - focusTime: string (e.g., "2h 15m")
    - tasks: TaskRecord[] (full list from backend)
    - completedTaskCount: number (derived from sorted tasks)
    - liveTaskCount: number (derived from sorted tasks)
- **Key Methods:**
    - refreshTasks(): fetches /tasks
    - handleToggleTask(task): optimistic + PATCH sync
    - handleMetricClick?: (metric) => void (expand dashboard)
- **Effects:**
    - Fetch tasks + focus time on mount
    - Storage event listener for pomodoro_last_update (triggers focus-time refetch)
- **Display:** Top 6 normalized + sorted tasks; dynamicDashboardMetrics with live counts

### TasksPage

- **Props:** None
- **State:**
    - tasks: TaskRecord[]
    - newTaskForm: {title, category, time, dueDate}
- **Key Methods:**
    - loadTasks(): fetches /tasks
    - handleToggleTask(task): same as DashboardPage
    - handleCreateTask(): POSTs to /tasks
- **Display:** All tasks, normalized + sorted, with creation form

### TimelineItem

- **Props:**
    - task: DisplayTask
    - onToggleCompletion: (task) => void
    - className?: string
- **UI:** Tick circle (clickable button), title (with strike-through if completed), category, time, due date

### PomodoroProvider

- **Context Value:** {selectedDuration, isRunning, timeRemaining, setSelectedDuration, start, pause, resume, reset, sessions}
- **Key Methods:**
    - start(): begins countdown timer
    - pause(): calls recordPartialSession + flushFocusSessionQueue on mount/online
    - resume(): resumes timer
    - reset(): clears state
    - tick(): increments sessions on natural completion
- **Side Effects:**
    - Flush queue on mount + online event
    - Syncs to localStorage + BroadcastChannel
    - Records partial sessions on pause

---

## 7. Known Patterns & Conventions

### Task Sorting Logic

```typescript
status priority: pending (0) < in-progress (1) < missed (2) < completed (3)
then: dueDate ascending (nearest first)
then: title lexicographic
```

Result: Pending tasks with nearest due dates at top, completed tasks at bottom.

### Optimistic UI Pattern

```typescript
// Update state immediately
setTasks((prev) =>
	prev.map((t) => (t.id === taskId ? { ...t, completed: nextCompleted } : t)),
);

// Sync to backend async
updateTaskCompletion(taskId, nextCompleted)
	.then(() => {
		/* success, state already updated */
	})
	.catch(() => refreshTasks()); // fallback: full refetch + resort
```

### Storage Event for Cross-Component Sync

```typescript
// Writer (pomodoro.tsx)
localStorage.setItem("pomodoro_last_update", new Date().toISOString());

// Listener (DashboardPage.tsx)
useEffect(() => {
	window.addEventListener("storage", (e) => {
		if (e.key === "pomodoro_last_update") {
			refreshFocusTime(); // refetch analytics
		}
	});
}, []);
```

### API Client Pattern

```typescript
// All requests use credentials: 'include' for cookie-based auth
const apiRequest = (endpoint, options) =>
	fetch(endpoint, { credentials: "include", ...options }).then((r) =>
		r.json(),
	);
```

---

## 8. Build & Validation

### Last Build Status ✅

```
npm run build
✓ 60 modules transformed
dist/assets/index-CGCZeU6o.js 221.26kB │ gzip 66.96kB
dist/assets/index-CGCZeU6o.css 24.85kB │ gzip 5.34kB
built in 3.44s
```

No TypeScript or JSX errors. All type definitions resolve correctly.

---

## 9. Pending / Future Considerations

### Not Yet Verified

- Backend endpoint exact payload shapes (assumed PATCH /tasks/{id} accepts {completed: bool})
- End-to-end runtime testing with user interaction
- Offline queue resilience (retry logic implemented but not tested in live app)

### Potential Enhancements

- Cancel/undo for task toggle (currently no undo)
- Batch task updates (currently single task PATCH)
- Task filtering by category/status on TasksPage
- Pomodoro session history graph
- Task analytics (completion rate, average time, etc.)

---

## 10. Quick Reference: Files to Know

```
src/
├── lib/
│   ├── pomodoro.tsx          ← PomodoroProvider + recordPartialSession
│   ├── api.ts                ← recordFocusSession, updateTaskCompletion, queue funcs
│   ├── taskDisplay.ts        ← normalizeTask, sortDisplayTasks (NEW)
│   └── [other utilities]
├── components/
│   └── dashboard/
│       └── TimelineItem.tsx  ← Task row with tick circle
├── pages/
│   ├── DashboardPage.tsx     ← Main dashboard, dynamic metrics + task toggle
│   ├── TasksPage.tsx         ← Full task list + creation
│   └── [other pages]
└── [App.tsx, main.tsx, etc.]
```

---

## 11. How to Continue

### If Resuming Work:

1. Read this file first for context
2. Check [DashboardPage.tsx](src/pages/DashboardPage.tsx) for current implementation
3. Verify [api.ts](src/lib/api.ts) for backend sync patterns
4. Review [taskDisplay.ts](src/lib/taskDisplay.ts) for sorting logic

### If Adding Features:

1. Follow optimistic update pattern (see section 7)
2. Use `sortDisplayTasks()` for any new task lists
3. Keep localStorage keys consistent: pomodoro_state, pomodoro_sessions, pomodoro_queue, pomodoro_last_update
4. Wire storage event listeners for cross-component sync
5. Always include fallback refresh on error

### If Debugging:

- Check browser DevTools → Application → localStorage for queue state
- Verify PATCH /tasks/{id} response shape matches TaskRecord
- Confirm BroadcastChannel("pomodoro") messages are being sent/received
- Review React DevTools for state consistency across components

---

## 12. Recent Changes Summary (This Session)

1. **Created** `src/lib/taskDisplay.ts` with shared `normalizeTask()` and `sortDisplayTasks()` helpers
2. **Modified** `src/lib/api.ts`: Added `enqueueFocusSession()`, `flushFocusSessionQueue()` (5-attempt retry), `updateTaskCompletion()`
3. **Modified** `src/lib/pomodoro.tsx`: Integrated queue import, enqueue on fail, flush on mount/online, storage event write
4. **Modified** `src/components/dashboard/TimelineItem.tsx`: Replaced status badge with clickable tick circle, added strike-through
5. **Modified** `src/pages/DashboardPage.tsx`: Added `refreshTasks()`, `handleToggleTask()`, dynamic metrics, storage listener
6. **Modified** `src/pages/TasksPage.tsx`: Applied same sorting + toggle logic as dashboard
7. **Validated:** Two successful production builds (60 modules, 221kB JS, 3.4s compile)

---

## Quick Copy-Paste for Next Chat

If starting a new chat, use this prompt:

```
I'm working on an Enbridge productivity dashboard (React + TypeScript + Vite + Tailwind + FastAPI backend).

**Current Status:** All features implemented and passing build validation.
- Pomodoro timer with analytics + retry queue for failed POSTs
- Dynamic task list with sorting (pending + nearest due date first, completed at bottom)
- Interactive task circles that toggle completion with optimistic UI + PATCH backend sync
- Cross-component sync via localStorage storage events
- Live "Tasks completed" metric on dashboard

**Key Files:**
- src/lib/pomodoro.tsx: PomodoroProvider + recordPartialSession + queue flush
- src/lib/api.ts: recordFocusSession, updateTaskCompletion, enqueueFocusSession, flushFocusSessionQueue
- src/lib/taskDisplay.ts: normalizeTask, sortDisplayTasks (shared helpers)
- src/pages/DashboardPage.tsx: Main dashboard with dynamic metrics + task toggle handler
- src/pages/TasksPage.tsx: Full task list with same toggle logic
- src/components/dashboard/TimelineItem.tsx: Task row with clickable tick circle

**Key Patterns:**
- Optimistic UI: update state first, PATCH async, fallback to full refresh on error
- Storage events: "pomodoro_last_update" written to localStorage on session record → triggers dashboard focus-time refetch
- Queue logic: failed recordFocusSession calls → enqueueFocusSession → flushFocusSessionQueue retries up to 5x
- Task sorting: status priority (pending < in-progress < missed < completed), then due date ASC, then title
- localStorage keys: pomodoro_state, pomodoro_sessions, pomodoro_queue, pomodoro_last_update (must stay consistent)

**API Endpoints (Backend):**
- GET /me: returns {data: {user: {...}}}
- GET /tasks: returns [{id, title, time, category, status, dueDate, completed}, ...]
- PATCH /tasks/{task_id}: {completed: bool} → returns updated TaskRecord
- POST /analytics/focus-sessions: {session_duration_minutes, completed_at, date}
- GET /analytics/focus-time: returns {focus_time_display, ...}

**Last Build:** ✓ 60 modules, 221kB JS, 3.4s compile, zero errors

**Next Steps:** End-to-end runtime testing, backend payload verification, or new features.

[Include link to this file: PROJECT_CONTEXT.md]
```

---

**Use this document as your single source of truth for project state. Update it after major changes.**
