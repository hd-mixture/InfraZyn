

'use client';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconFolders,
  IconListChecks,
  IconUsers,
  IconLogout,
  IconPlus,
  IconClock,
  IconClipboardList,
  IconCode,
} from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreateProjectForm } from "./create-project-form";
import { Button } from "../ui/button";

export function AppSidebar() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');

  const isActive = (view: string | null) => {
    if (!currentView && (view === null || view === 'dashboard')) {
        return true;
    }
    return currentView === view;
  }
  
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.clear();
    }
  }

  const links = [
    {
      label: "Dashboard",
      href: "/",
      icon: <IconLayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive(null),
    },
    {
      label: "Projects",
      href: "/?view=projects",
      icon: <IconFolders className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('projects'),
    },
    {
      label: "Tasks",
      href: "/?view=tasks",
      icon: <IconListChecks className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('tasks'),
    },
    {
      label: "Time Log",
      href: "/?view=time-log",
      icon: <IconClock className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('time-log'),
    },
    {
      label: "Resource Mgmt",
      href: "/?view=resource-mgmt",
      icon: <IconClipboardList className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('resource-mgmt'),
    },
    {
      label: "Users",
      href: "/?view=users",
      icon: <IconUsers className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('users'),
    },
  ];

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex items-center gap-2 p-2">
                <IconCode className="w-8 h-8 text-primary" />
                <h1 className="text-xl font-semibold font-headline">DevTeXhHub</h1>
            </div>
            <div className="mt-4">
              <CreateProjectForm>
                <Button className="w-full">
                    <IconPlus className="h-4 w-4 mr-2" />
                    New Project
                </Button>
              </CreateProjectForm>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              onClick={handleLogout}
              link={{
                label: "Logout",
                href: "/login",
                icon: (
                  <IconLogout className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
                ),
              }}
            />
          </div>
        </SidebarBody>
    </Sidebar>
  );
}
