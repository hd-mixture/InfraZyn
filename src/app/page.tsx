'use client';

/**
 * Main Application Shell & Route Controller
 * MoSPI / IPMD PAIMANA Ecosystem
 * Team: InfraZyn | Hackathon: SIH26103 | "Predict. Monitor. Prevent."
 */

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from "react";

// Infrastructure Components (SIH26103)
import { InfraProject } from "@/types/infrastructure";
import { getStoredProjects } from "@/lib/infrastructure/demo-dataset";
import { InfraDashboard } from "@/components/infrastructure/infra-dashboard";
import { InfraProjectTable } from "@/components/infrastructure/infra-project-table";
import { InfraProjectDetail } from "@/components/infrastructure/infra-project-detail";
import { InfraRiskMonitor } from "@/components/infrastructure/infra-risk-monitor";
import { InfraBenchmarking } from "@/components/infrastructure/infra-benchmarking";
import { InfraCostDrivers } from "@/components/infrastructure/infra-cost-drivers";
import { InfraModelInsights } from "@/components/infrastructure/infra-model-insights";
import { InfraDataImport } from "@/components/infrastructure/infra-data-import";
import { InfraAIAssistant } from "@/components/infrastructure/infra-ai-assistant";

// Existing Preserved Views
import { UserManagement } from "@/components/dashboard/user-management";
import { TimeLogView } from "@/components/dashboard/time-log-view";
import { AdminProfileView } from "@/components/dashboard/admin-profile-view";
import { AdminSettingsView } from "@/components/dashboard/admin-settings-view";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get('view');
  const [searchQuery, setSearchQuery] = useState('');

  // Infrastructure Projects State
  const [infraProjects, setInfraProjects] = useState<InfraProject[]>(() => getStoredProjects());
  const [selectedInfraProject, setSelectedInfraProject] = useState<InfraProject | null>(null);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loaded = getStoredProjects();
    setInfraProjects(loaded);
  }, []);

  // When changing view away from projects, clear selected project
  useEffect(() => {
    if (view !== 'projects') {
      setSelectedInfraProject(null);
    }
  }, [view]);

  const handleSelectProject = (project: InfraProject) => {
    setSelectedInfraProject(project);
    router.push('/?view=projects');
  };

  const handleNavigateToAssistantWithQuery = (query: string) => {
    setAssistantInitialQuery(query);
    router.push('/?view=ai-assistant');
  };

  const handleSelectProjectByCodeOrName = (identifier: string) => {
    const q = identifier.toLowerCase();
    const found = infraProjects.find(
      p => p.projectName.toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q)
    );
    if (found) {
      setSelectedInfraProject(found);
      router.push('/?view=projects');
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'projects':
        if (selectedInfraProject) {
          return (
            <InfraProjectDetail
              project={selectedInfraProject}
              allProjects={infraProjects}
              onBack={() => setSelectedInfraProject(null)}
              onNavigateToAssistantWithQuery={handleNavigateToAssistantWithQuery}
            />
          );
        }
        return (
          <InfraProjectTable
            projects={infraProjects}
            onSelectProject={handleSelectProject}
          />
        );

      case 'risk-monitor':
      case 'early-warnings':
        return (
          <InfraRiskMonitor
            projects={infraProjects}
            onSelectProject={handleSelectProject}
          />
        );

      case 'benchmarking':
        return <InfraBenchmarking projects={infraProjects} />;

      case 'cost-drivers':
        return <InfraCostDrivers projects={infraProjects} />;

      case 'model-insights':
        return <InfraModelInsights projects={infraProjects} />;

      case 'ai-assistant':
        return (
          <InfraAIAssistant
            projects={infraProjects}
            initialQuery={assistantInitialQuery}
            onSelectProjectByCodeOrName={handleSelectProjectByCodeOrName}
          />
        );

      case 'data-import':
        return (
          <InfraDataImport
            currentProjects={infraProjects}
            onDataUpdated={newProjs => setInfraProjects(newProjs)}
          />
        );

      // Preserved views
      case 'users':
        return <UserManagement />;
      case 'time-log':
        return <TimeLogView />;
      case 'profile':
        return <AdminProfileView />;
      case 'settings':
        return <AdminSettingsView />;

      // Default: Infrastructure Monitoring Dashboard
      case 'dashboard':
      default:
        return (
          <InfraDashboard
            projects={infraProjects}
            onSelectProject={handleSelectProject}
            onNavigateView={v => router.push(`/?view=${v}`)}
          />
        );
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background flex-1">
      <DashboardHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      {renderContent()}
    </main>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role) {
      setIsAuthenticated(true);
    } else {
      // Auto-provision demo admin credentials for seamless evaluation
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userName', 'Director (IPMD / MoSPI)');
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Loading platform...</div>;
  }

  return (
    <SidebarProvider>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading platform...</div>}>
        <div className="flex h-screen">
          <AppSidebar />
          <div className="flex-1 flex flex-col h-screen overflow-y-auto">
            <DashboardContent />
          </div>
        </div>
      </Suspense>
    </SidebarProvider>
  );
}
