
'use client';

import { Search, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/dashboard/user-nav";
import { DelayPredictor } from "./delay-predictor";
import { SidebarTrigger } from "../ui/sidebar";
import Link from "next/link";
import { useSidebar } from "../ui/sidebar";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

function Breadcrumb() {
    const searchParams = useSearchParams();
    const view = searchParams.get('view');

    const pageTitle = useMemo(() => {
        if(view === 'users') return 'User Management';
        // Can be extended for other views like /projects, /tasks etc.
        return 'Overview'
    }, [view]);


    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{pageTitle}</span>
        </div>
    )
}


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
    <header className="sticky top-0 z-10 flex h-auto flex-col gap-4 border-b bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-6 md:gap-0 md:py-0 md:h-28">
        <div className="flex items-center justify-between h-14">
            {isMobile ? <SidebarTrigger /> : <Breadcrumb />}
             <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search for anything..."
                        className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
                    />
                </div>
                 <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Toggle notifications</span>
                </Button>
                <UserNav />
            </div>
        </div>
       <div className="flex items-center justify-between h-14">
            <h1 className="text-2xl font-semibold">{pageTitle}</h1>
            <div className="flex items-center gap-2">
                <DelayPredictor />
            </div>
       </div>
    </header>
  );
}

