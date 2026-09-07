

'use client';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconFolders,
  IconAlertTriangle,
  IconBell,
  IconChartBar,
  IconTrendingUp,
  IconCpu,
  IconSparkles,
  IconUpload,
  IconClock,
  IconUsers,
  IconLogout,
  IconPlus,
} from "@tabler/icons-react";
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
      active: isActive(null) || isActive('dashboard'),
    },
    {
      label: "Projects",
      href: "/?view=projects",
      icon: <IconFolders className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('projects'),
    },
    {
      label: "Risk Monitor",
      href: "/?view=risk-monitor",
      icon: <IconAlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />,
      active: isActive('risk-monitor'),
    },
    {
      label: "Early Warnings",
      href: "/?view=early-warnings",
      icon: <IconBell className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />,
      active: isActive('early-warnings'),
    },
    {
      label: "Benchmarking",
      href: "/?view=benchmarking",
      icon: <IconChartBar className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('benchmarking'),
    },
    {
      label: "Cost Drivers",
      href: "/?view=cost-drivers",
      icon: <IconTrendingUp className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('cost-drivers'),
    },
    {
      label: "Model Insights",
      href: "/?view=model-insights",
      icon: <IconCpu className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('model-insights'),
    },
    {
      label: "AI Assistant",
      href: "/?view=ai-assistant",
      icon: <IconSparkles className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />,
      active: isActive('ai-assistant'),
    },
    {
      label: "Data Import",
      href: "/?view=data-import",
      icon: <IconUpload className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('data-import'),
    },
    {
      label: "Time Log",
      href: "/?view=time-log",
      icon: <IconClock className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('time-log'),
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
