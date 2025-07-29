

'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { ProjectSummary, Project } from "@/components/dashboard/project-summary";
import { OverallProgress } from "@/components/dashboard/overall-progress";
import { UserManagement } from "@/components/dashboard/user-management";
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from "react";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TasksKanbanView } from "@/components/dashboard/tasks-kanban-view";
import { TimeLogView } from "@/components/dashboard/time-log-view";
import { ResourceManagementView } from "@/components/dashboard/resource-management-view";
import { ProjectTableView } from "@/components/dashboard/project-table-view";
import { EditProjectForm } from "@/components/dashboard/edit-project-form";
import { AdminProfileView } from "@/components/dashboard/admin-profile-view";
import { AdminSettingsView } from "@/components/dashboard/admin-settings-view";

function DashboardContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const [searchQuery, setSearchQuery] = useState('');

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };


  const renderContent = () => {
    switch (view) {
      case 'users':
        return <UserManagement />;
      case 'projects':
        return <ProjectTableView searchQuery={searchQuery} onEditProject={handleEditProject} />;
      case 'tasks':
        return <TasksKanbanView userRole="admin" />;
      case 'time-log':
        return <TimeLogView />;
      case 'resource-mgmt':
        return <ResourceManagementView />;
      case 'profile':
        return <AdminProfileView />;
      case 'settings':
        return <AdminSettingsView />;
      default:
        return (
          <>
            <Overview />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <ProjectSummary searchQuery={searchQuery} onEditProject={handleEditProject} />
              </div>
              <div className="space-y-6">
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
      {editingProject && (
        <EditProjectForm
            project={editingProject}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
        />
      )}
    </main>
  )
}


export default function DashboardPage() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
            router.push('/login');
        }
    }, [router]);

    if (!isClient) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

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
