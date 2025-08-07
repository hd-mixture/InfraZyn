

'use client';
import React from "react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconPalette,
  IconPhoto,
  IconLogout,
  IconUser,
  IconSettings
} from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo, LogoIcon } from "./logo";

export function DesignerSidebar() {
  const searchParams = useSearchParams();
  const { open } = useSidebar();
  const currentView = searchParams.get('view')

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
      href: "/designer-dashboard?view=dashboard",
      icon: (
        <IconLayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      active: isActive('dashboard')
    },
    {
      label: "My Designs",
      href: "/designer-dashboard?view=designs",
      icon: (
        <IconPalette className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      active: isActive('designs')
    },
    {
      label: "Moodboards",
      href: "/designer-dashboard?view=moodboards",
      icon: (
        <IconPhoto className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      active: isActive('moodboards')
    },
  ];

  const bottomLinks = [
     {
      label: "Profile",
      href: "/designer-dashboard?view=profile",
      icon: <IconUser className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('profile'),
    },
     {
      label: "Settings",
      href: "/designer-dashboard?view=settings",
      icon: <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
      active: isActive('settings'),
    },
  ]

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        <div>
          {bottomLinks.map((link, idx) => (
            <SidebarLink key={idx} link={link} />
          ))}
          <SidebarLink
            link={{
              label: "Logout",
              href: "/login",
              icon: (
                <IconLogout className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              ),
            }}
            onClick={handleLogout}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
