// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  Message01Icon,
  Folder02Icon,
  Add01Icon,
  CircleArrowUpRight02Icon,
  Search01Icon,
  BarChartIcon,
  Tick01Icon,
  Settings02Icon,
  InformationCircleIcon,
  DatabaseIcon,
  Mail01Icon,
  LeftToRightListDashIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface TabConfig {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  header: string;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: DashboardSquare01Icon,
    header: "Project Overview",
    description: "Daily summary of your team performance.",
  },
  {
    id: "management",
    label: "Management",
    icon: UserGroupIcon,
    header: "Team Management",
    description: "Manage roles and user permissions.",
    badge: "10",
  },
  {
    id: "threads",
    label: "Threads",
    icon: Message01Icon,
    header: "Communications",
    description: "High-priority team discussions.",
    badge: "12",
  },
  {
    id: "resources",
    label: "Resources",
    icon: Folder02Icon,
    header: "System Assets",
    description: "Shared documentation and media logs.",
  },
];

const BentoCard = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const content = useMemo(() => {
    switch (activeTab.id) {
      case "dashboard":
        return <OverviewDashboard />;
      case "management":
        return <ManagementDashboard />;
      case "threads":
        return <ThreadsDashboard />;
      case "resources":
        return <ResourcesDashboard />;
      default:
        return null;
    }
  }, [activeTab.id]);

  return (
    <div className="flex w-full items-center justify-center antialiased">
      <div className="group bg-card shadow-primary/5 hover:shadow-primary/10 relative m-0 w-full max-w-xl overflow-hidden rounded-3xl border shadow-2xl transition-all duration-500 hover:-translate-y-1 sm:rounded-4xl">
        <div className="relative z-10 space-y-1.5 p-4 sm:p-6">
          <h2 className="text-muted-foreground text-xs uppercase">Project Dashboard</h2>
          <p className="text-foreground max-w-[480px] text-lg leading-snug font-medium sm:text-2xl">
            High-performance analytics and team collaboration tools in one place.
          </p>
        </div>

        <div className="relative h-[260px] w-full overflow-hidden rounded-2xl sm:h-[300px] sm:rounded-[2rem]">
          <div className="bg-muted border-border/50 absolute top-16 left-16 h-full w-full rounded-3xl border opacity-80" />

          <div className="bg-background ring-border absolute top-8 left-24 flex h-full w-full flex-col overflow-hidden rounded-tl-3xl shadow-xl ring-6">
            <div className="border-border/70 relative flex items-center rounded-tl-3xl border-b px-5 py-4 backdrop-blur-sm">
              <div className="flex gap-1.5">
                <div className="bg-muted-foreground/20 h-2 w-2 rounded-full" />
                <div className="bg-muted-foreground/20 h-2 w-2 rounded-full" />
                <div className="bg-muted-foreground/20 h-2 w-2 rounded-full" />
              </div>
              <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
                <span className="text-muted-foreground/50 text-xs uppercase">Workspace</span>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="border-border/30 bg-muted/5 flex w-36 flex-col gap-1 border-r p-2 pt-6">
                <LayoutGroup>
                  {TABS.map((tab) => {
                    const isActive = activeTab.id === tab.id;
                    const Icon = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "relative flex cursor-pointer items-center gap-1.5 rounded-xl p-2 text-xs transition-colors",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <HugeiconsIcon icon={Icon} size={14} className="relative z-20 shrink-0" />
                        <span className="relative z-20 truncate font-medium">{tab.label}</span>
                        {tab.badge && (
                          <span
                            className={cn(
                              "relative z-20 ml-auto rounded-md px-1 py-0.5 text-[8px] leading-none tabular-nums transition-all",
                              isActive
                                ? "bg-primary/10 text-primary border-primary/20 border"
                                : "bg-muted text-muted-foreground border border-transparent"
                            )}
                          >
                            {tab.badge}
                          </span>
                        )}

                        {isActive && (
                          <motion.div
                            layoutId="sidebar-pill"
                            className="bg-primary border-primary/20 absolute left-0 z-30 h-4 w-[2px] rounded-full border"
                            transition={{
                              type: "spring",
                              bounce: 0.2,
                              duration: 0.6,
                            }}
                          />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="backgroundIndicator"
                            className="bg-muted border-border/40 absolute inset-0 rounded-lg border"
                            transition={{
                              type: "spring",
                              bounce: 0.2,
                              duration: 0.6,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </LayoutGroup>
              </div>

              <div className="bg-background relative flex flex-1 flex-col gap-4 overflow-hidden p-5 pt-6">
                <header className="flex flex-col gap-0.5">
                  <h3 className="text-foreground line-clamp-1 text-xs font-semibold tracking-tight uppercase opacity-60">
                    {activeTab.header}
                  </h3>
                  <p className="text-muted-foreground line-clamp-1 text-[10px] leading-tight font-normal">
                    {activeTab.description}
                  </p>
                </header>

                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={activeTab.id}
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1"
                  >
                    {content}
                  </motion.div>
                </AnimatePresence>

                <div className="from-background pointer-none absolute right-0 bottom-0 left-0 z-20 h-10 bg-linear-to-t to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoCard;

const OverviewDashboard = () => (
  <div className="flex h-full flex-col gap-3">
    <div className="border-border/40 from-background to-muted/20 relative overflow-hidden rounded-xl border bg-linear-to-br p-3.5">
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[9px] font-medium">Team Performance</span>
          <HugeiconsIcon icon={CircleArrowUpRight02Icon} size={12} className="text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-xl font-medium tracking-tight">94.2%</span>
          <div className="bg-muted mt-1 h-1 w-full overflow-hidden rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "94.2%" }}
              className="bg-primary h-full rounded-full"
            />
          </div>
        </div>
        <span className="text-muted-foreground text-[9px]">
          Score for Search & Delivery campaigns
        </span>
      </div>
      <div className="absolute -right-2 -bottom-2 scale-150 rotate-12 opacity-5">
        <HugeiconsIcon icon={BarChartIcon} size={64} />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="border-border/40 bg-background/50 flex items-center justify-between rounded-xl border p-3">
        <div className="flex flex-col">
          <span className="text-foreground text-[10px] font-medium">1,070</span>
          <span className="text-muted-foreground text-[8px] font-medium uppercase">Keywords</span>
        </div>
        <HugeiconsIcon icon={Search01Icon} size={14} className="opacity-20" />
      </div>
      <div className="border-border/40 bg-background/50 flex items-center justify-between rounded-xl border p-3">
        <div className="flex flex-col">
          <span className="text-foreground text-[10px] font-medium">2.3M</span>
          <span className="text-muted-foreground text-[8px] font-medium uppercase">Credits</span>
        </div>
        <HugeiconsIcon icon={InformationCircleIcon} size={14} className="opacity-20" />
      </div>
    </div>
  </div>
);

const ManagementDashboard = () => (
  <div className="not-prose flex h-full flex-col">
    <div className="border-border/40 bg-background/50 flex h-full flex-col overflow-hidden rounded-xl border">
      <div className="bg-muted/30 border-border/40 flex items-center justify-between border-b px-3 py-2">
        <span className="text-muted-foreground text-[9px] font-semibold tracking-wider uppercase">
          Active Users
        </span>
        <div className="bg-background border-border/40 flex items-center gap-1.5 rounded-md border px-1.5 py-0.5">
          <HugeiconsIcon icon={Search01Icon} size={10} className="text-muted-foreground/50" />
          <span className="text-muted-foreground text-[8px] font-medium">Search</span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 p-1">
        {[
          {
            name: "Anthony Dionne",
            role: "Pending admin approval",
            status: "Waitlist",
            color: "bg-amber-400",
          },
          {
            name: "Nick Yahodin",
            role: "Dealership group admin",
            status: "Active",
            color: "bg-emerald-400",
          },
          {
            name: "Mujeeb Aimaq",
            role: "Dealership group user",
            status: "Active",
            color: "bg-emerald-400",
          },
        ].map((user, i) => (
          <div
            key={i}
            className="hover:bg-muted/30 group flex items-center gap-3 rounded-lg p-2 transition-colors"
          >
            <div className="bg-muted border-border/40 relative flex h-6 w-6 items-center justify-center rounded-full border">
              <HugeiconsIcon icon={UserIcon} size={10} className="text-muted-foreground" />
              <div
                className={cn(
                  "border-background absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border",
                  user.color
                )}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-foreground truncate text-[10px] font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-[8px]">{user.role}</span>
            </div>
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
              <HugeiconsIcon icon={Settings02Icon} size={12} className="text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ThreadsDashboard = () => (
  <div className="flex h-full flex-col gap-3">
    <div className="grid grid-cols-2 gap-3">
      {[
        {
          title: "Create a Page",
          desc: "Build your project base.",
          icon: Folder02Icon,
        },
        {
          title: "Create a Task",
          desc: "Organize with team.",
          icon: Tick01Icon,
        },
      ].map((card, i) => (
        <div
          key={i}
          className="border-border/40 bg-background/50 group relative flex flex-col gap-3 overflow-hidden rounded-xl border p-3.5"
        >
          <div className="z-10 flex flex-col gap-1">
            <span className="text-foreground text-[12px] leading-tight font-medium">
              {card.title}
            </span>
            <span className="text-muted-foreground text-[9px] leading-tight">{card.desc}</span>
          </div>
          <button className="bg-foreground text-background group-hover:bg-primary z-10 flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[8px] font-semibold transition-transform active:scale-95">
            <HugeiconsIcon icon={Add01Icon} size={8} strokeWidth={3} />
            Create
          </button>
        </div>
      ))}
    </div>

    <div className="bg-muted/20 border-border/30 mt-auto flex items-center justify-between rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <div className="bg-background border-border/40 rounded-md border p-1 px-1.5">
          <HugeiconsIcon icon={InformationCircleIcon} size={10} className="text-muted-foreground" />
        </div>
        <span className="text-muted-foreground text-[9px] font-medium">Pin a new item</span>
      </div>
      <HugeiconsIcon icon={Add01Icon} size={12} className="text-muted-foreground/50" />
    </div>
  </div>
);

const ResourcesDashboard = () => (
  <div className="flex h-full flex-col gap-3 overflow-hidden">
    <div className="border-border/40 bg-background/50 flex flex-1 flex-col overflow-hidden rounded-xl border">
      <div className="bg-muted/30 border-border/40 flex items-center justify-between border-b px-3 py-2">
        <span className="text-muted-foreground text-[9px] font-semibold tracking-wider uppercase">
          Archives & Logs
        </span>
        <HugeiconsIcon icon={DatabaseIcon} size={12} className="text-muted-foreground/30" />
      </div>
      <div className="scrollbar-hide flex-1 overflow-y-auto p-1">
        {[
          {
            file: "design_spec_v2.pdf",
            size: "2.4 MB",
            type: "PDF",
            icon: Mail01Icon,
          },
          {
            file: "q4_performance.xls",
            size: "1.1 MB",
            type: "XLS",
            icon: BarChartIcon,
          },
          {
            file: "branding_assets.zip",
            size: "48 MB",
            type: "ZIP",
            icon: Folder02Icon,
          },
          {
            file: "system_logs.json",
            size: "4 KB",
            type: "JSON",
            icon: Folder02Icon,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="hover:bg-muted/30 group flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-colors"
          >
            <div className="bg-muted/50 border-border/40 text-muted-foreground/60 group-hover:text-primary group-hover:bg-primary/5 flex h-6 w-6 items-center justify-center rounded-md border transition-colors">
              <HugeiconsIcon icon={item.icon} size={12} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-foreground truncate text-[10px] font-medium">{item.file}</span>
              <span className="text-muted-foreground text-[8px] uppercase tabular-nums">
                {item.size} • {item.type}
              </span>
            </div>
            <HugeiconsIcon
              icon={CircleArrowUpRight02Icon}
              size={10}
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);
