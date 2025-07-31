
'use client';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DeveloperSidebar } from "@/components/dashboard/developer-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DeveloperDashboardView } from "@/components/dashboard/developer-dashboard-view";
import { AssignedTasksView } from "@/components/dashboard/assigned-tasks-view";
import { ComingSoon } from "@/components/dashboard/coming-soon";

function DeveloperDashboardContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const [developerName, setDeveloperName] = useState<string | null>(null);

  useEffect(() => {
    setDeveloperName(localStorage.getItem('userName'));
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'tasks':
        return <AssignedTasksView developerName={developerName} />;
      case 'projects':
        return <ComingSoon />;
      case 'profile':
        return <ComingSoon />;
      case 'settings':
        return <ComingSoon />;
      case 'dashboard':
      default:
        return <DeveloperDashboardView developerName={developerName} />;
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

export default function DeveloperDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role === 'developer') {
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
      <DeveloperSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen overflow-y-auto">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
            <DeveloperDashboardContent />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
