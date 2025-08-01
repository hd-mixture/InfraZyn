

'use client';

import { Search, Bell, LayoutDashboard, Users, Folders, ListChecks, Timer, ClipboardList, UsersRound, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/dashboard/user-nav";
import { DelayPredictor } from "./delay-predictor";
import { SidebarTrigger, useSidebar } from "../ui/sidebar";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { NotificationPanel } from "./notification-panel";

type DashboardHeaderProps = {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
};

export function DashboardHeader({ searchQuery, setSearchQuery }: DashboardHeaderProps) {
  const { isMobile } = useSidebar();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const view = searchParams.get('view');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setRole(localStorage.getItem('userRole'));
    }
  }, []);

  const pageInfo = useMemo(() => {
        if (pathname.includes('manager')) {
            switch(view) {
                case 'users':
                    return { title: 'Team', icon: <Users className="h-7 w-7" /> };
                case 'tasks':
                    return { title: 'Tasks', icon: <ListChecks className="h-7 w-7" /> };
                case 'manage-team':
                    return { title: 'Manage Team', icon: <UsersRound className="h-7 w-7" /> };
                case 'profile':
                    return { title: 'Profile', icon: <User className="h-7 w-7" /> };
                case 'settings':
                    return { title: 'Settings', icon: <Settings className="h-7 w-7" /> };
                case 'projects':
                default:
                    return { title: 'Projects', icon: <Folders className="h-7 w-7" /> };
            }
        }
        switch (view) {
            case 'projects':
                return { title: 'Projects', icon: <Folders className="h-7 w-7" /> };
            case 'tasks':
                return { title: 'Tasks', icon: <ListChecks className="h-7 w-7" /> };
            case 'time-log':
                return { title: 'Time Log', icon: <Timer className="h-7 w-7" /> };
            case 'resource-mgmt':
                return { title: 'Resource Management', icon: <ClipboardList className="h-7 w-7" /> };
            case 'users':
                return { title: 'User Management', icon: <Users className="h-7 w-7" /> };
            case 'profile':
                return { title: 'Profile', icon: <User className="h-7 w-7" /> };
            case 'settings':
                return { title: 'Settings', icon: <Settings className="h-7 w-7" /> };
            default:
                return { title: 'Dashboard', icon: <LayoutDashboard className="h-7 w-7" /> };
        }
    }, [view, pathname]);
    
  const toggleSearch = () => setShowSearchInput(prev => !prev);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }

  return (
    <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            {isMobile && <SidebarTrigger className="-ml-2" />}
            <div className={cn("flex items-center gap-3", isMobile && showSearchInput && "hidden")}>
              {pageInfo.icon}
              <h1 className="text-2xl font-bold">{pageInfo.title}</h1>
            </div>
        </div>
        <div className={cn("flex items-center gap-2", isMobile && showSearchInput && "w-full")}>
            <div className={cn("relative", isMobile && !showSearchInput ? "hidden" : "block", isMobile && showSearchInput && "w-full")}>
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onBlur={isMobile ? toggleSearch : undefined}
                />
            </div>
            {isMobile && !showSearchInput && (
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={toggleSearch}
                >
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                </Button>
            )}
            <div className={cn("flex items-center gap-2", isMobile && showSearchInput && "hidden")}>
                {role === 'admin' && <DelayPredictor />}
                <NotificationPanel />
                <UserNav />
            </div>
        </div>
    </header>
  );
}
