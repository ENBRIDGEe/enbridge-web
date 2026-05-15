import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import { PomodoroProvider } from "./lib/pomodoro";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<AuthProvider>
			<PomodoroProvider>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</PomodoroProvider>
		</AuthProvider>
	</React.StrictMode>,
);
