

'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { ProjectSummary } from "@/components/dashboard/project-summary";
import { OverallProgress } from "@/components/dashboard/overall-progress";
import { UserManagement } from "@/components/dashboard/user-management";
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from "react";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { TasksKanbanView } from "@/components/dashboard/tasks-kanban-view";

function DashboardContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (view) {
      case 'users':
        return <UserManagement />;
      case 'projects':
        return <ProjectSummary searchQuery={searchQuery} />;
      case 'tasks':
        return <TasksKanbanView />;
      case 'time-log':
      case 'resource-mgmt':
        return <ComingSoon />;
      default:
        return (
          <>
            <Overview />
            <div className="grid gap-6 lg:grid-cols-7 lg:items-stretch">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <OverallProgress />
                <RecentActivity />
              </div>
            </div>
          </>
        );
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background flex-1">
      <DashboardHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      {renderContent()}
    </main>
  )
}


export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen overflow-y-auto">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
            <DashboardContent />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
