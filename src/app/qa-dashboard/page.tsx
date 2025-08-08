
'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { QASidebar } from "@/components/dashboard/qa-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RecentBugReports } from "@/components/dashboard/recent-bug-reports";
import { AssignedTestingTasks } from "@/components/dashboard/assigned-testing-tasks";
import { QADashboardView } from "@/components/dashboard/qa-dashboard-view";
import { TestCasesView } from "@/components/dashboard/test-cases-view";

function QADashboardContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const [qaName, setQaName] = useState<string | null>(null);

  useEffect(() => {
    setQaName(localStorage.getItem('userName'));
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'testing-tasks':
        return <AssignedTestingTasks qaName={qaName} />;
      case 'bug-reports':
        return <RecentBugReports qaName={qaName} />;
      case 'test-cases':
        return <TestCasesView qaName={qaName} searchQuery={searchQuery} />;
      case 'profile':
        return <ComingSoon />;
      case 'settings':
        return <ComingSoon />;
      case 'dashboard':
      default:
        return <QADashboardView qaName={qaName} />;
    }
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 gap-6">
      <DashboardHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
       <main className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
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
