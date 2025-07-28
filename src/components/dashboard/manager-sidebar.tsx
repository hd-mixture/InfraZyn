
'use client';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, ListChecks, Users, LogOut, PlusCircle, CodeXml, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import Link from "next/link";
import { CreateTaskForm } from "./create-task-form";
import { cn } from "@/lib/utils";

export function ManagerSidebar() {
  const searchParams = useSearchParams();
  const { toggleSidebar, state } = useSidebar();
  const currentView = searchParams.get('view');

  const isActive = (view: string | null) => {
    if (view === null) {
      return currentView === null || currentView === 'tasks';
    }
    return currentView === view;
  }
  
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
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
        <div>
            <CreateTaskForm>
              <Button className="w-full bg-primary text-primary-foreground h-12 rounded-lg mb-4 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:self-center group-data-[collapsible=icon]:hover:w-full group-data-[collapsible=icon]:hover:rounded-lg transition-all duration-300 ease-in-out">
                  <PlusCircle />
                  <span className="group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:hover:inline">Create new task</span>
              </Button>
            </CreateTaskForm>
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(null)} tooltip="Tasks" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/manager-dashboard?view=tasks">
                    <ListChecks />
                    <span className="group-data-[collapsible=icon]:hidden">Tasks</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive('users')} tooltip="Users" className="group-data-[collapsible=icon]:justify-center">
                  <Link href="/manager-dashboard?view=users">
                    <Users />
                    <span className="group-data-[collapsible=icon]:hidden">Team</span>
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
