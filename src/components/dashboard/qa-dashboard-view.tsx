
'use client';
import { BugReportStats } from "./bug-report-stats";
import { TestCaseResults } from "./test-case-results";
import { AssignedTestingTasks } from "./assigned-testing-tasks";
import { RecentBugReports } from "./recent-bug-reports";


type QADashboardViewProps = {
    qaName: string | null;
};

export function QADashboardView({ qaName }: QADashboardViewProps) {
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
            <BugReportStats qaName={qaName} />
            </div>
            <TestCaseResults qaName={qaName} />
        </div>
        <AssignedTestingTasks qaName={qaName} isDashboard />
        <RecentBugReports qaName={qaName} isDashboard />
    </div>
  );
}
