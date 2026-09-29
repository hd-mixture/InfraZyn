'use client';

/**
 * Enterprise Application Sidebar Component
 * DevTeXhHub | Team InfraZyn (SIH26103)
 * 
 * Features:
 * - Collapsed (72px) rail expanding smoothly to (280px) on hover.
 * - Organized functional groupings: Core Monitoring, Analytics & ML, Data & Management.
 * - Live status badges (Early Warnings alert, FastAPI online, Gemini AI).
 * - Executive user profile card with graceful collapse state.
 */

import React from 'react';
import { Sidebar, SidebarBody, SidebarLink, SidebarLinkItem, useSidebar } from "@/components/ui/sidebar";
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
  IconShieldCheck,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { CreateProjectForm } from "./create-project-form";
import { Button } from "../ui/button";
import { Logo, LogoIcon } from "./logo";
import { motion } from "framer-motion";

export function AppSidebar() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  const { open } = useSidebar();

  const isActive = (view: string | null) => {
    if (!currentView && (view === null || view === 'dashboard' || view === 'overview')) {
      return true;
    }
    return currentView === view;
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  // Section 1: Core Monitoring Links
  const coreMonitoringLinks: SidebarLinkItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: <IconLayoutDashboard className="h-4.5 w-4.5 shrink-0 text-slate-700 dark:text-slate-200" />,
      active: isActive(null) || isActive('dashboard') || isActive('overview'),
    },
    {
      label: "Projects Registry",
      href: "/?view=projects",
      icon: <IconFolders className="h-4.5 w-4.5 shrink-0 text-blue-600 dark:text-blue-400" />,
      active: isActive('projects'),
      badge: "16",
      badgeColor: "blue",
    },
    {
      label: "Risk Monitor",
      href: "/?view=risk-monitor",
      icon: <IconAlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-500 dark:text-amber-400" />,
      active: isActive('risk-monitor'),
      badge: "0-100",
      badgeColor: "amber",
    },
    {
      label: "Early Warnings",
      href: "/?view=early-warnings",
      icon: <IconBell className="h-4.5 w-4.5 shrink-0 text-rose-500 dark:text-rose-400" />,
      active: isActive('early-warnings'),
      badge: "3 Active",
      badgeColor: "red",
    },
  ];

  // Section 2: Analytics & AI Intelligence
  const analyticsLinks: SidebarLinkItem[] = [
    {
      label: "Benchmarking",
      href: "/?view=benchmarking",
      icon: <IconChartBar className="h-4.5 w-4.5 shrink-0 text-indigo-600 dark:text-indigo-400" />,
      active: isActive('benchmarking'),
    },
    {
      label: "Cost Drivers",
      href: "/?view=cost-drivers",
      icon: <IconTrendingUp className="h-4.5 w-4.5 shrink-0 text-cyan-600 dark:text-cyan-400" />,
      active: isActive('cost-drivers'),
    },
    {
      label: "Model Insights",
      href: "/?view=model-insights",
      icon: <IconCpu className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />,
      active: isActive('model-insights'),
      badge: "FastAPI",
      badgeColor: "emerald",
    },
    {
      label: "AI Copilot",
      href: "/?view=ai-assistant",
      icon: <IconSparkles className="h-4.5 w-4.5 shrink-0 text-violet-600 dark:text-violet-400" />,
      active: isActive('ai-assistant'),
      badge: "Gemini",
      badgeColor: "purple",
    },
  ];

  // Section 3: Data & Admin Management
  const dataAdminLinks: SidebarLinkItem[] = [
    {
      label: "Data Ingestion",
      href: "/?view=data-import",
      icon: <IconUpload className="h-4.5 w-4.5 shrink-0 text-slate-600 dark:text-slate-300" />,
      active: isActive('data-import'),
      badge: "Dual Tab",
      badgeColor: "slate",
    },
    {
      label: "Milestone & Audit Logs",
      href: "/?view=time-log",
      icon: <IconClock className="h-4.5 w-4.5 shrink-0 text-slate-600 dark:text-slate-300" />,
      active: isActive('time-log'),
      badge: "MoSPI",
      badgeColor: "emerald",
    },
    {
      label: "User Access",
      href: "/?view=users",
      icon: <IconUsers className="h-4.5 w-4.5 shrink-0 text-slate-600 dark:text-slate-300" />,
      active: isActive('users'),
    },
  ];

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-6">
        {/* Top Header & Navigation Links */}
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden no-scrollbar">
          {/* Logo Area */}
          <div className="px-1.5 py-1 mb-3">
            {open ? <Logo /> : <LogoIcon />}
          </div>

          {/* Quick Action: New Project */}
          <div className="mb-4">
            <CreateProjectForm>
              <Button
                className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs rounded-xl h-9 transition-all duration-200"
              >
                <IconPlus className="h-4.5 w-4.5 shrink-0" />
                <motion.span
                  animate={{
                    display: open ? "inline-block" : "none",
                    opacity: open ? 1 : 0,
                    width: open ? 'auto' : 0,
                    marginLeft: open ? '0.5rem' : 0,
                  }}
                  transition={{ duration: 0.18 }}
                  className="text-xs font-semibold whitespace-nowrap overflow-hidden"
                >
                  New Project Record
                </motion.span>
              </Button>
            </CreateProjectForm>
          </div>

          {/* Group 1: Core Monitoring */}
          <div className="space-y-1 mb-4">
            {open && (
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Core Monitoring
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {coreMonitoringLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-2 my-1 border-t border-slate-200/60 dark:border-slate-800/60" />

          {/* Group 2: Analytics & AI */}
          <div className="space-y-1 mb-4">
            {open && (
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Predictive AI & Analytics
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {analyticsLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-2 my-1 border-t border-slate-200/60 dark:border-slate-800/60" />

          {/* Group 3: Data & Admin */}
          <div className="space-y-1">
            {open && (
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Governance & Ingestion
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {dataAdminLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom User Profile & Logout Footer */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="p-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2 overflow-hidden">
            {/* User Avatar with Online Pulse */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                  DI
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>

              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col min-w-0 overflow-hidden"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                    Director (IPMD)
                    <IconShieldCheck className="h-3 w-3 text-blue-600 shrink-0 inline" />
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    MoSPI Admin
                  </span>
                </motion.div>
              )}
            </div>

            {/* Logout Action */}
            {open ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-7 w-7 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg shrink-0"
                title="Log Out"
              >
                <IconLogout className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
