
'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { ManagerSidebar } from "@/components/dashboard/manager-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Suspense, useState, useEffect } from "react";
import { TasksKanbanView } from "@/components/dashboard/tasks-kanban-view";
import { useRouter } from "next/navigation";
import { UserManagement } from "@/components/dashboard/user-management";
import { useSearchParams } from 'next/navigation'
import { ManagerProjectView } from "@/components/dashboard/manager-project-view";
import { ManageTeamView } from "@/components/dashboard/manage-team-view";


function ManagerDashboardContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const [managerName, setManagerName] = useState<string | null>(null);

  useEffect(() => {
    setManagerName(localStorage.getItem('userName'));
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'users':
        return <UserManagement userRole="manager" />;
      case 'tasks':
        return <TasksKanbanView searchQuery={searchQuery} userRole="manager" managerName={managerName} />;
      case 'manage-team':
        return <ManageTeamView managerName={managerName} />;
      case 'projects':
      default:
        return <ManagerProjectView searchQuery={searchQuery} managerName={managerName} />;
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background flex-1">
      <DashboardHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
       {renderContent()}
    </main>
  )
}


export default function ManagerDashboardPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const role = localStorage.getItem('userRole');
    if (role !== 'manager') {
      router.push('/login');
    }
  }, [router]);

  if (!isClient) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <ManagerSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen overflow-y-auto">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
            <ManagerDashboardContent />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
