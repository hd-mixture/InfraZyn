
'use client';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, ListChecks, LogOut, CodeXml, ChevronLeft, ChevronRight, Folders, Settings, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DeveloperSidebar() {
  const searchParams = useSearchParams();
  const { toggleSidebar, state } = useSidebar();
  const currentView = searchParams.get('view');

  const isActive = (view: string | null) => {
    if (!currentView && (view === 'dashboard' || view === null)) {
      return true;
    }
    return currentView === view;
  }
  
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.clear();
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 flex items-center justify-center group/logo-toggle cursor-pointer" onClick={toggleSidebar}>
                <CodeXml className={cn("w-8 h-8 text-primary transition-opacity duration-200 opacity-100 group-hover/logo-toggle:opacity-0")} />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/logo-toggle:opacity-100">
                    {state === 'expanded' ? <ChevronLeft className="w-6 h-6 text-primary" /> : <ChevronRight className="w-6 h-6 text-primary" />}
                </div>
            </div>
            <h1 className="text-xl font-semibold font-headline group-data-[collapsible=icon]:hidden">DevTeXhHub</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 flex flex-col justify-between">
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('dashboard')} tooltip="Dashboard" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/developer-dashboard?view=dashboard">
                    <LayoutDashboard />
                    <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('tasks')} tooltip="My Tasks" className="group-data-[collapsible=icon]:justify-center">
                 <Link href="/developer-dashboard?view=tasks">
                    <ListChecks />
                    <span className="group-data-[collapsible=icon]:hidden">My Tasks</span>
                 </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('projects')} tooltip="Projects" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/developer-dashboard?view=projects">
                    <Folders />
                    <span className="group-data-[collapsible=icon]:hidden">Projects</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('profile')} tooltip="Profile" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/developer-dashboard?view=profile">
                    <User />
                    <span className="group-data-[collapsible=icon]:hidden">Profile</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('settings')} tooltip="Settings" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/developer-dashboard?view=settings">
                    <Settings />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Logout" className="group-data-[collapsible=icon]:justify-center" onClick={handleLogout}>
                    <Link href="/login">
                      <LogOut />
                      <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4" />
    </Sidebar>
  );
}
