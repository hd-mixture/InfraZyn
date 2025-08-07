
'use client';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconFolders,
  IconListChecks,
  IconUsers,
  IconLogout,
  IconPlus,
  IconCode,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import Link from "next/link";
import { CreateTaskForm } from "./create-task-form";
import { useEffect, useState } from "react";

export function ManagerSidebar() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  const [managerName, setManagerName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setManagerName(localStorage.getItem('userName'));
    }
  }, []);

  const isActive = (view: string | null) => {
    if (!currentView && (view === 'projects' || view === null)) {
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
      label: "Projects",
      href: "/manager-dashboard?view=projects",
      icon: <IconFolders className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('projects'),
    },
    {
      label: "Tasks",
      href: "/manager-dashboard?view=tasks",
      icon: <IconListChecks className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('tasks'),
    },
    {
      label: "Team",
      href: "/manager-dashboard?view=users",
      icon: <IconUsers className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('users'),
    },
    {
      label: "Manage Team",
      href: "/manager-dashboard?view=manage-team",
      icon: <IconUsersGroup className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('manage-team'),
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
              <CreateTaskForm userRole="manager" managerName={managerName}>
                 <Button className="w-full">
                    <IconPlus className="h-4 w-4 mr-2" />
                    New Task
                </Button>
              </CreateTaskForm>
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
