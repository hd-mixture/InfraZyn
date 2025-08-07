
'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/dashboard/designer-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { DesignerDashboardView } from "@/components/dashboard/designer-dashboard-view";

function DesignerDashboardContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const [designerName, setDesignerName] = useState<string | null>(null);

  useEffect(() => {
    setDesignerName(localStorage.getItem('userName'));
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'designs':
      case 'moodboards':
      case 'profile':
      case 'settings':
        return <ComingSoon />;
      case 'dashboard':
      default:
        return <DesignerDashboardView designerName={designerName} />;
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


export default function DesignerDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role === 'designer') {
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <SidebarProvider>
         <div className="flex-1 flex items-center justify-center">Loading...</div>;
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
        <DesignerSidebar />
        <div className="flex flex-col h-screen overflow-y-auto bg-background flex-1">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
            <DesignerDashboardContent />
          </Suspense>
        </div>
    </SidebarProvider>
  );
}
