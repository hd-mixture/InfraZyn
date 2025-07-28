
'use client';

import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/dashboard/user-nav";
import { DelayPredictor } from "./delay-predictor";
import { SidebarTrigger, useSidebar } from "../ui/sidebar";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function DashboardHeader() {
  const { isMobile } = useSidebar();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  const pageTitle = useMemo(() => {
        if(view === 'users') return 'User Management';
        // Can be extended for other views like /projects, /tasks etc.
        return 'Dashboard'
    }, [view]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        {isMobile && <SidebarTrigger className="-ml-2" />}
        <h1 className="text-xl font-semibold hidden md:block">{pageTitle}</h1>
        <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          />
        </div>
        <DelayPredictor />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        <UserNav />
    </header>
  );
}
