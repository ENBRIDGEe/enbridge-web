import { Navigate, Route, Routes } from "react-router-dom";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SiteFooter } from "./components/layout/SiteFooter";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { TasksPage } from "./pages/TasksPage";
import { HabitsPage } from "./pages/HabitsPage";
import { FocusPage } from "./pages/FocusPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
	return (
		<div className="min-h-screen bg-ink text-pearl">
			<Routes>
				<Route
					path="/"
					element={
						<>
							<SiteHeader />
							<LandingPage />
							<SiteFooter />
						</>
					}
				/>
				<Route path="/login" element={<AuthPage mode="login" />} />
				<Route
					path="/register"
					element={<AuthPage mode="register" />}
				/>
				<Route
					path="/app"
					element={
						<ProtectedRoute>
							<Navigate to="/app/dashboard" replace />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/app/dashboard"
					element={
						<ProtectedRoute>
							<DashboardPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/app/tasks"
					element={
						<ProtectedRoute>
							<TasksPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/app/habits"
					element={
						<ProtectedRoute>
							<HabitsPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/app/focus"
					element={
						<ProtectedRoute>
							<FocusPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/app/settings"
					element={
						<ProtectedRoute>
							<SettingsPage />
						</ProtectedRoute>
					}
				/>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</div>
	);
}
