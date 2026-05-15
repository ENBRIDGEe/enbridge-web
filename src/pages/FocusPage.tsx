import { AppLayout } from "../components/layout/AppLayout";
import PomodoroTimer from "../components/pomodoro/PomodoroTimer";

export function FocusPage() {
	return (
		<AppLayout>
			<section>
				<PomodoroTimer />
			</section>
		</AppLayout>
	);
}
