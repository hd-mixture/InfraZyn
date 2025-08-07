
'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/dashboard/designer-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MoodboardsView } from "@/components/dashboard/moodboards-view";
import { DesignerDashboardView } from "@/components/dashboard/designer-dashboard-view";
import { MyDesignsView } from "@/components/dashboard/my-designs-view";

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
        return <MyDesignsView designerName={designerName} searchQuery={searchQuery} />;
      case 'moodboards':
        return <MoodboardsView designerName={designerName} searchQuery={searchQuery} />;
      case 'dashboard':
      default:
        return <DesignerDashboardView designerName={designerName} />;
    }
  }

  return (
    <div className="flex flex-1">
      <div className="flex flex-col h-screen flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
            <DashboardHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">
          {renderContent()}
        </main>
      </div>
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
        <div className="h-screen w-full flex items-center justify-center">Loading...</div>
    )
  }

  return (
    <SidebarProvider>
        <div className="flex h-screen">
            <DesignerSidebar />
            <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
                <DesignerDashboardContent />
            </Suspense>
        </div>
    </SidebarProvider>
  );
}
