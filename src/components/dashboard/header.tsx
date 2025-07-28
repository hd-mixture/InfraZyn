
'use client';

import { Search, Bell, LayoutDashboard, Users } from "lucide-react";
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

  const pageInfo = useMemo(() => {
        if(view === 'users') {
            return { title: 'User Management', icon: <Users className="h-7 w-7" /> };
        }
        // Can be extended for other views like /projects, /tasks etc.
        return { title: 'Dashboard', icon: <LayoutDashboard className="h-7 w-7" /> };
    }, [view]);

  return (
    <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            {isMobile && <SidebarTrigger className="-ml-2" />}
            <div className="flex items-center gap-3">
              {pageInfo.icon}
              <h1 className="text-2xl font-bold">{pageInfo.title}</h1>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative md:w-[200px] lg:w-[336px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full rounded-lg bg-background pl-8"
                />
            </div>
            <DelayPredictor />
            <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
            >
                <Bell className="h-4 w-4" />
                <span className="sr-only">Toggle notifications</span>
            </Button>
            <UserNav />
        </div>
    </header>
  );
}
