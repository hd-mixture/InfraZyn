
'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { ProjectSummary } from "@/components/dashboard/project-summary";
import { OverallProgress } from "@/components/dashboard/overall-progress";
import { UserManagement } from "@/components/dashboard/user-management";
import { useSearchParams } from 'next/navigation'
import { Suspense } from "react";
import { RecentActivity } from "@/components/dashboard/recent-activity";

function DashboardContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view')

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background flex-1">
      {view === 'users' ? (
        <>
          <h2 className="text-xl font-semibold">User Management</h2>
          <UserManagement />
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Overview</h2>
          <Overview />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 lg:items-start">
            <div className="lg:col-span-5 h-full">
              <ProjectSummary />
            </div>
            <div className="lg:col-span-2 flex flex-col gap-6">
              <OverallProgress />
              <RecentActivity />
            </div>
          </div>
        </>
      )}
    </main>
  )
}


export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen overflow-y-auto">
          <DashboardHeader />
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
            <DashboardContent />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
