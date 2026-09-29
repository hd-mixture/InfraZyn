"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconX } from "@tabler/icons-react";
import Link from 'next/link';

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string;
  badgeColor?: 'red' | 'blue' | 'amber' | 'emerald' | 'purple' | 'slate';
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

const SidebarWrapper = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.div> & { children?: React.ReactNode }) => {
  const { isMobile, open, setOpen, animate } = useSidebar();

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.28,
              ease: [0.25, 1, 0.5, 1],
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl p-6 z-[100] flex flex-col justify-between border-r border-slate-200 dark:border-slate-800",
              className
            )}
          >
            <button
              type="button"
              className="absolute right-6 top-6 p-2 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <IconX className="h-5 w-5" />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      className={cn(
        "h-full hidden md:flex md:flex-col bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[1px_0_15px_-4px_rgba(0,0,0,0.05)] z-40 select-none overflow-hidden",
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "72px") : "280px",
      }}
      transition={{
        duration: 0.26,
        ease: [0.22, 1, 0.36, 1], // Smooth custom cubic-bezier
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.aside>
  );
};

export const Sidebar = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.div> & { children?: React.ReactNode }) => {
  const { isMobile } = useSidebar();
  if (isMobile) {
    return null;
  }
  return (
    <SidebarWrapper className={className} {...props}>
      {children}
    </SidebarWrapper>
  );
};

export const SidebarBody = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.div> & { children?: React.ReactNode }) => {
  const { isMobile } = useSidebar();
  if (isMobile) {
    return (
      <SidebarWrapper className={className} {...props}>
        {children}
      </SidebarWrapper>
    );
  }
  return (
    <div className={cn("h-full w-full flex flex-col justify-between py-4 px-3", className)}>
      {children}
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: SidebarLinkItem;
  className?: string;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'blue':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      case 'amber':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
      case 'purple':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-180 group/sidebar overflow-hidden",
        link.active
          ? "bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/70 dark:border-blue-900/60 shadow-2xs"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/70 border border-transparent",
        className
      )}
      {...props}
    >
      {/* Active Indicator Bar on the left */}
      {link.active && (
        <motion.div
          layoutId="sidebarActiveBar"
          className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 dark:bg-blue-500"
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Icon Container with subtle pop on active */}
      <div className="relative shrink-0 flex items-center justify-center">
        {link.icon}
        {/* Micro-dot for unread / alert badges when collapsed */}
        {!open && link.badge && link.badgeColor === 'red' && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
        )}
      </div>

      {/* Text Label & Badge shown when sidebar expands on hover */}
      <motion.div
        animate={{
          opacity: animate ? (open ? 1 : 0) : 1,
          width: animate ? (open ? "auto" : 0) : "auto",
        }}
        transition={{ duration: 0.18 }}
        className="flex items-center justify-between flex-1 min-w-0 whitespace-nowrap overflow-hidden"
      >
        <span className="truncate group-hover/sidebar:translate-x-0.5 transition-transform duration-150">
          {link.label}
        </span>

        {link.badge && (
          <span
            className={cn(
              "ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border shrink-0",
              getBadgeStyle(link.badgeColor)
            )}
          >
            {link.badge}
          </span>
        )}
      </motion.div>
    </Link>
  );
};
