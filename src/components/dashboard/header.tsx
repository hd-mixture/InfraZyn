
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/dashboard/user-nav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DelayPredictor } from "./delay-predictor";
import { SidebarTrigger } from "../ui/sidebar";

export function DashboardHeader() {
  return (
    <header className="flex h-20 items-center justify-between border-b bg-transparent px-4 md:px-6">
        <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for anything..."
            className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
        <DelayPredictor />
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        <UserNav />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
