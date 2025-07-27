'use client';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, Folders, ListChecks, Users, Settings, LogOut, PlusCircle, Timer, ClipboardList, Package, CodeXml } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import Link from "next/link";
import { CreateProjectForm } from "./create-project-form";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');

  const isActive = (view: string | null) => {
    if (view === null) {
      return currentView === null;
    }
    return currentView === view;
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <CodeXml className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold font-headline group-data-[collapsible=icon]:hidden">DevTeXhHub</h1>
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="p-4 flex flex-col justify-between">
        <div>
            <CreateProjectForm>
              <Button className="w-full bg-primary text-primary-foreground h-12 rounded-lg mb-4 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:rounded-full">
                  <PlusCircle />
                  <span className="group-data-[collapsible=icon]:hidden">Create new project</span>
              </Button>
            </CreateProjectForm>
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(null) && pathname === '/'} tooltip="Dashboard">
                  <Link href="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/projects')} tooltip="Projects">
                <Folders />
                <span>Projects</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/tasks')} tooltip="Tasks">
                <ListChecks />
                <span>Tasks</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/dashboard-link')} tooltip="Dashboard Link">
                <Package />
                <span>Dashboard</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/time-log')} tooltip="Time Log">
                <Timer />
                <span>Time log</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/resource-mgmt')} tooltip="Resource Mgmt">
                <ClipboardList />
                <span>Resource mgnt</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive('users')} tooltip="Users">
                  <Link href="/?view=users">
                    <Users />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            </SidebarMenu>
        </div>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Logout">
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
