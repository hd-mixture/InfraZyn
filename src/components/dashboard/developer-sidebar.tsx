
'use client';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconListChecks,
  IconFolders,
  IconSettings,
  IconUser,
  IconLogout,
  IconCode,
} from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function DeveloperSidebar() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');

  const isActive = (view: string | null) => {
    if (!currentView && (view === 'dashboard' || view === null)) {
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
      href: "/developer-dashboard?view=dashboard",
      icon: <IconLayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('dashboard'),
    },
    {
      label: "My Tasks",
      href: "/developer-dashboard?view=tasks",
      icon: <IconListChecks className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('tasks'),
    },
    {
      label: "Projects",
      href: "/developer-dashboard?view=projects",
      icon: <IconFolders className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('projects'),
    },
  ];

  const bottomLinks = [
     {
      label: "Profile",
      href: "/developer-dashboard?view=profile",
      icon: <IconUser className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('profile'),
    },
     {
      label: "Settings",
      href: "/developer-dashboard?view=settings",
      icon: <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('settings'),
    },
    {
      label: "Logout",
      href: "/login",
      icon: <IconLogout className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    }
  ]

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex items-center gap-2 p-2">
                <IconCode className="w-8 h-8 text-primary" />
                <h1 className="text-xl font-semibold font-headline">DevTeXhHub</h1>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
        </div>
        <div>
           {bottomLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} onClick={link.label === 'Logout' ? handleLogout : undefined}/>
            ))}
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
