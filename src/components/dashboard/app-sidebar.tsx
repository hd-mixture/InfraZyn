'use client';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Folders, ListChecks, Users, Settings, LogOut, PlusCircle, Timer, ClipboardList, Package, CodeXml, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import Link from "next/link";
import { CreateProjectForm } from "./create-project-form";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleSidebar, state } = useSidebar();
  const currentView = searchParams.get('view');

  const isActive = (view: string | null) => {
    if (view === null) {
      return currentView === null;
    }
    return currentView === view;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 flex items-center justify-center group/logo-toggle cursor-pointer" onClick={toggleSidebar}>
                <CodeXml className={cn("w-8 h-8 text-primary transition-opacity duration-200", state === 'expanded' ? 'group-hover/logo-toggle:opacity-0' : 'opacity-100')} />
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
              <Button className="w-full bg-primary text-primary-foreground h-12 rounded-lg mb-4 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:justify-center">
                  <PlusCircle />
                  <span className="group-data-[collapsible=icon]:hidden">Create new project</span>
              </Button>
            </CreateProjectForm>
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(null) && pathname === '/'} tooltip="Dashboard" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/">
                    <LayoutDashboard />
                    <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/projects')} tooltip="Projects" className="group-data-[collapsible=icon]:justify-center">
                <Folders />
                <span className="group-data-[collapsible=icon]:hidden">Projects</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/tasks')} tooltip="Tasks" className="group-data-[collapsible=icon]:justify-center">
                <ListChecks />
                <span className="group-data-[collapsible=icon]:hidden">Tasks</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/dashboard-link')} tooltip="Dashboard Link" className="group-data-[collapsible=icon]:justify-center">
                <Package />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/time-log')} tooltip="Time Log" className="group-data-[collapsible=icon]:justify-center">
                <Timer />
                <span className="group-data-[collapsible=icon]:hidden">Time log</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/resource-mgmt')} tooltip="Resource Mgmt" className="group-data-[collapsible=icon]:justify-center">
                <ClipboardList />
                <span className="group-data-[collapsible=icon]:hidden">Resource mgnt</span>
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
                <SidebarMenuButton asChild tooltip="Logout" className="group-data-[collapsible=icon]:justify-center">
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
