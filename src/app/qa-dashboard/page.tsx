
'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { QASidebar } from "@/components/dashboard/qa-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BugReportStats } from "@/components/dashboard/bug-report-stats";
import { TestCaseResults } from "@/components/dashboard/test-case-results";
import { AssignedTestingTasks } from "@/components/dashboard/assigned-testing-tasks";
import { RecentBugReports } from "@/components/dashboard/recent-bug-reports";
import { ComingSoon } from "@/components/dashboard/coming-soon";

function QADashboardContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams()
  const view = searchParams.get('view')

  const renderContent = () => {
    switch (view) {
      case 'testing-tasks':
        return <AssignedTestingTasks />;
      case 'bug-reports':
        return <RecentBugReports />;
      case 'test-cases':
        return <ComingSoon />;
      case 'profile':
        return <ComingSoon />;
      case 'settings':
        return <ComingSoon />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BugReportStats />
              </div>
              <TestCaseResults />
            </div>
            <AssignedTestingTasks />
            <RecentBugReports />
          </div>
        );
    }
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 gap-6">
      <DashboardHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
       <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  )
}


export default function QADashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role === 'qa') {
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthenticated) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <SidebarProvider>
        <div className="flex h-screen">
            <QASidebar />
            <div className="flex flex-col flex-1 h-screen overflow-y-auto">
                <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
                    <QADashboardContent />
                </Suspense>
            </div>
        </div>
    </SidebarProvider>
  );
}

