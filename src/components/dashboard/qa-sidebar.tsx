

'use client';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconBug,
  IconListCheck,
  IconFileText,
  IconLogout,
  IconUser,
  IconSettings
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "./logo";


export function QASidebar() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  const { open } = useSidebar();

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
        href: "/qa-dashboard?view=dashboard",
        icon: <IconLayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
        active: isActive('dashboard')
    },
    {
        label: "Testing Tasks",
        href: "/qa-dashboard?view=testing-tasks",
        icon: <IconListCheck className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
        active: isActive('testing-tasks')
    },
    {
        label: "Bug Reports",
        href: "/qa-dashboard?view=bug-reports",
        icon: <IconBug className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
        active: isActive('bug-reports')
    },
    {
        label: "Test Cases",
        href: "/qa-dashboard?view=test-cases",
        icon: <IconFileText className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
        active: isActive('test-cases')
    }
  ];

  const bottomLinks = [
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
            {open ? <Logo /> : <LogoIcon />}
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
