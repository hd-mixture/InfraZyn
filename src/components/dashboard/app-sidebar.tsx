

'use client';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Folders, ListChecks, Users, Settings, LogOut, PlusCircle, Timer, ClipboardList, Package, CodeXml, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import Link from "next/link";
import { CreateProjectForm } from "./create-project-form";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleSidebar, state } = useSidebar();
  const currentView = searchParams.get('view');
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setRole(localStorage.getItem('userRole'));
    }
  }, []);

  const isActive = (view: string | null) => {
    if (view === null) {
      return currentView === null;
    }
    return currentView === view;
  }
  
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
    }
  }

  if (role !== 'admin') {
    return null; // Or a loading spinner, or a manager-specific sidebar
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
        <div>
            <CreateProjectForm>
              <Button className="w-full bg-primary text-primary-foreground h-12 rounded-lg mb-4 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:self-center group-data-[collapsible=icon]:hover:w-full group-data-[collapsible=icon]:hover:rounded-lg transition-all duration-300 ease-in-out">
                  <PlusCircle />
                  <span className="group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:hover:inline">Create new project</span>
              </Button>
            </CreateProjectForm>
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(null)} tooltip="Dashboard" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/">
                    <LayoutDashboard />
                    <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('projects')} tooltip="Projects" className="group-data-[collapsible=icon]:justify-center">
                 <Link href="/?view=projects">
                    <Folders />
                    <span className="group-data-[collapsible=icon]:hidden">Projects</span>
                 </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('tasks')} tooltip="Tasks" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/?view=tasks">
                    <ListChecks />
                    <span className="group-data-[collapsible=icon]:hidden">Tasks</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('time-log')} tooltip="Time Log" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/?view=time-log">
                    <Timer />
                    <span className="group-data-[collapsible=icon]:hidden">Time log</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('resource-mgmt')} tooltip="Resource Mgmt" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/?view=resource-mgmt">
                    <ClipboardList />
                    <span className="group-data-[collapsible=icon]:hidden">Resource mgnt</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive('users')} tooltip="Users" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/?view=users">
                    <Users />
                    <span className="group-data-[collapsible=icon]:hidden">Users</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            </SidebarMenu>
        </div>
        <SidebarMenu>
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
      <SidebarFooter className="p-4">
      </SidebarFooter>
    </Sidebar>
  );
}
