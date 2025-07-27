import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { ProjectSummary } from "@/components/dashboard/project-summary";
import { RecentTasks } from "@/components/dashboard/recent-tasks";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background">
          <Overview />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <ProjectSummary />
            </div>
            <div className="lg:col-span-3">
              <RecentTasks />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
