
'use client';

import { AssignedTasksView } from "./assigned-tasks-view";
import { TaskProgressChart } from "./task-progress-chart";
import { UpcomingDeadlinesCard } from "./upcoming-deadlines-card";

type DeveloperDashboardViewProps = {
    developerName: string | null;
};

export function DeveloperDashboardView({ developerName }: DeveloperDashboardViewProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AssignedTasksView developerName={developerName} isDashboard />
                </div>
                <div className="space-y-6">
                    <TaskProgressChart developerName={developerName} />
                    <UpcomingDeadlinesCard developerName={developerName} />
                </div>
            </div>
        </div>
    );
}
