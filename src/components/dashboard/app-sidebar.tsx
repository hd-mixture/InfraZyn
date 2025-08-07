

'use client';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconFolders,
  IconListCheck,
  IconUsers,
  IconLogout,
  IconPlus,
  IconClock,
  IconClipboardList,
} from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreateProjectForm } from "./create-project-form";
import { Button } from "../ui/button";
import { Logo, LogoIcon } from "./logo";
import { useSidebar } from "@/components/ui/sidebar";
import { motion } from "framer-motion";

export function AppSidebar() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  const { open } = useSidebar();


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
      icon: <IconListCheck className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
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
             {open ? <Logo /> : <LogoIcon />}
            <div className="mt-4">
              <CreateProjectForm>
                <Button className="w-full justify-center">
                    <IconPlus className="h-5 w-5" />
                     <motion.span
                        animate={{
                            display: open ? "inline-block" : "none",
                            opacity: open ? 1 : 0,
                            width: open ? 'auto' : 0,
                            marginLeft: open ? '0.5rem' : 0,
                        }}
                        className="text-sm whitespace-pre"
                        >
                        New Project
                    </motion.span>
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
