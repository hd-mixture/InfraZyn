'use client';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Folders, ListChecks, Users, Settings, LogOut, PlusCircle, Timer, ClipboardList, Package } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

const PromageIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" stroke="#F36F2E" strokeWidth="2.5"/>
        <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" fill="#F36F2E"/>
    </svg>
)


export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
            <PromageIcon />
            <h1 className="text-xl font-semibold font-headline">Promage</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 flex flex-col justify-between">
        <div>
            <Button className="w-full bg-primary text-primary-foreground h-12 rounded-full mb-4">
                <PlusCircle />
                <span>Create new project</span>
            </Button>
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="/" isActive={pathname === '/'} >
                <LayoutDashboard />
                <span>Dashboard</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" isActive={pathname.startsWith('/projects')}>
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
