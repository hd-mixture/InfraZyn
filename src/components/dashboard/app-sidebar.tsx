'use client';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Folders, ListChecks, Users, Settings, LogOut, PlusCircle, Timer, ClipboardList, Package, CodeXml } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import Link from "next/link";
import { CreateProjectForm } from "./create-project-form";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
            <CodeXml className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold font-headline">DevTeXhHub</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 flex flex-col justify-between">
        <div>
            <CreateProjectForm>
              <Button className="w-full bg-primary text-primary-foreground h-12 rounded-full mb-4">
                  <PlusCircle />
                  <span>Create new project</span>
              </Button>
            </CreateProjectForm>
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="/" isActive={pathname === '/'} >
                <LayoutDashboard />
                <span>Dashboard</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/projects" isActive={pathname.startsWith('/projects')}>
                <Folders />
                <span>Projects</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/tasks')}>
                <ListChecks />
                <span>Tasks</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/dashboard-link')}>
                <Package />
                <span>Dashboard</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/time-log')}>
                <Timer />
                <span>Time log</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/resource-mgmt')}>
                <ClipboardList />
                <span>Resource mgnt</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/users')}>
                <Users />
                <span>Users</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            </SidebarMenu>
        </div>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="/login">
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
      </SidebarFooter>
    </Sidebar>
  );
}
