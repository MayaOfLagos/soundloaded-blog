"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ProfileIcon,
  Search01Icon,
  Cancel01Icon,
  Add01Icon,
  Briefcase01Icon,
  PaintBoardIcon,
  Database01Icon,
  QuillWrite01Icon,
} from "@hugeicons/core-free-icons";

interface Member {
  id: string;
  name: string;
  status: string;
  online: boolean;
  role: string;
  roleType: "pm" | "designer" | "data" | "creator";
  avatar: string;
}

const ALL_MEMBERS: Member[] = [
  {
    id: "01",
    name: "Oliver Smith",
    status: "Online",
    online: true,
    role: "Project Manager",
    roleType: "pm",
    avatar: "https://tapback.co/api/avatar/Oliver.webp",
  },
  {
    id: "02",
    name: "Sophie Chen",
    status: "17m ago",
    online: false,
    role: "Designer",
    roleType: "designer",
    avatar: "https://tapback.co/api/avatar/Sophie.webp",
  },
  {
    id: "03",
    name: "Noah Wilson",
    status: "29m ago",
    online: false,
    role: "Data Specialist",
    roleType: "data",
    avatar: "https://tapback.co/api/avatar/Noah.webp",
  },
  {
    id: "04",
    name: "Emma Davis",
    status: "48m ago",
    online: false,
    role: "Creator",
    roleType: "creator",
    avatar: "https://tapback.co/api/avatar/Emma.webp",
  },
  {
    id: "05",
    name: "Leo Garcia",
    status: "Online",
    online: true,
    role: "Designer",
    roleType: "designer",
    avatar: "https://tapback.co/api/avatar/Leo.webp",
  },
  {
    id: "06",
    name: "Mia Thompson",
    status: "Online",
    online: true,
    role: "Project Manager",
    roleType: "pm",
    avatar: "https://tapback.co/api/avatar/Mia.webp",
  },
  {
    id: "07",
    name: "Ethan Wright",
    status: "5h ago",
    online: false,
    role: "Data Specialist",
    roleType: "data",
    avatar: "https://tapback.co/api/avatar/Ethan.webp",
  },
];

const ACTIVE_MEMBERS = ALL_MEMBERS.filter((m) => m.online);

const sweepSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 35,
  mass: 0.5,
};

const RoleBadge = ({ type, label }: { type: Member["roleType"]; label: string }) => {
  const styles = {
    pm: {
      bg: "bg-[#FFFCEB]",
      text: "text-[#856404]",
      border: "border-[#FFEBA5]",
      icon: Briefcase01Icon,
    },
    designer: {
      bg: "bg-[#F0F7FF]",
      text: "text-[#004085]",
      border: "border-[#B8DAFF]",
      icon: PaintBoardIcon,
    },
    data: {
      bg: "bg-[#F3FAF4]",
      text: "text-[#155724]",
      border: "border-[#C3E6CB]",
      icon: Database01Icon,
    },
    creator: {
      bg: "bg-[#FCF5FF]",
      text: "text-[#522785]",
      border: "border-[#E8D1FF]",
      icon: QuillWrite01Icon,
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${style.bg} ${style.text} ${style.border} shrink-0`}
    >
      <HugeiconsIcon icon={Icon} size={12} strokeWidth={1.8} />
      <span className="font-regular max-w-[60px] truncate text-xs tracking-tight whitespace-nowrap uppercase sm:max-w-none">
        {label}
      </span>
    </div>
  );
};

const MemberItem = ({ member }: { member: Member }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, x: 10, y: 15, rotate: 1 },
      visible: { opacity: 1, x: 0, y: 0, rotate: 0 },
    }}
    transition={sweepSpring}
    style={{ originX: 1, originY: 1 }}
    className="group border-border/40 flex items-center border-b py-4 first:pt-0 last:border-0"
  >
    <div className="relative mr-4 shrink-0">
      <img
        src={member.avatar}
        alt={member.name}
        className="ring-background h-12 w-12 rounded-full shadow-sm ring-2 grayscale-[0.1] transition-all duration-300 group-hover:grayscale-0"
      />
      {member.online && (
        <div className="bg-background absolute right-0 bottom-0 flex h-3.5 w-3.5 items-center justify-center rounded-full shadow-sm">
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <h3 className="text-foreground mb-1.5 truncate text-base leading-none font-semibold tracking-tight">
        {member.name}
      </h3>
      <div className="flex items-center gap-1.5 opacity-80">
        {member.online && <div className="h-1.5 w-1.5 rounded-full bg-green-500" />}
        <p
          className={`text-sm leading-none font-medium ${
            member.online ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          {member.status}
        </p>
      </div>
    </div>
    <div className="shrink-0">
      <RoleBadge type={member.roleType} label={member.role} />
    </div>
  </motion.div>
);

export default function StackedList() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAllMembers = useMemo(
    () =>
      ALL_MEMBERS.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.role.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  return (
    <div className="bg-muted/50 not-prose flex min-h-screen w-full items-center justify-center p-6 font-sans">
      <div className="bg-background border-border relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-[40px] border pb-6 shadow-none">
        <div className="bg-background flex h-full flex-col">
          <div className="p-8 pb-3">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-foreground flex items-center gap-2 text-lg font-semibold tracking-tight">
                Active Members
                <span className="bg-muted text-muted-foreground mt-0.5 rounded-full px-2 py-1 text-xs leading-none font-normal">
                  {ACTIVE_MEMBERS.length}
                </span>
              </h2>
              <Button
                variant="outline"
                size="icon"
                className="border-border/50 text-muted-foreground hover:bg-muted/50 h-9 w-9 rounded-full"
              >
                <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2.5} />
              </Button>
            </div>

            <div className="relative mb-4">
              <HugeiconsIcon
                icon={Search01Icon}
                className="text-muted-foreground/60 absolute top-1/2 left-4 z-10 -translate-y-1/2"
                size={16}
              />
              <Input
                placeholder="Search teammates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted/40 focus-visible:ring-border text-foreground placeholder:text-muted-foreground/50 box-border h-11 w-full rounded-2xl border-none pr-4 pl-11 text-base transition-all focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="custom-scrollbar scroll-visible flex-1 overflow-y-auto px-8 pb-20">
            <motion.div
              initial={false}
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              className="space-y-0.5"
            >
              {ACTIVE_MEMBERS.map((member) => (
                <MemberItem key={`active-${member.id}`} member={member} />
              ))}
            </motion.div>
          </div>
        </div>

        <motion.div
          layout
          initial={false}
          animate={{
            height: isExpanded ? "calc(100% - 20px)" : "68px",
            width: isExpanded ? "calc(100% - 20px)" : "calc(100% - 40px)",
            bottom: isExpanded ? "10px" : "20px",
            left: isExpanded ? "10px" : "20px",
            borderRadius: isExpanded ? "32px" : "24px",
          }}
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 30,
            mass: 0.8,
            ease: "easeInOut",
          }}
          className="border-border group/bar bg-card absolute z-50 flex flex-col overflow-hidden border shadow-none"
          style={{ cursor: isExpanded ? "default" : "pointer" }}
          onClick={() => !isExpanded && setIsExpanded(true)}
        >
          <div
            className={`flex h-[68px] shrink-0 items-center justify-between px-3 transition-colors ${
              isExpanded ? "border-border/40 border-b" : "hover:bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`bg-background border-border text-muted-foreground/80 flex h-11 w-11 items-center justify-center rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-transform group-hover/bar:scale-105`}
              >
                <HugeiconsIcon icon={ProfileIcon} size={20} strokeWidth={2} />
              </div>
              <motion.div layout="position">
                <h4 className="text-foreground text-base leading-none font-medium tracking-tight">
                  Member Directory
                </h4>
                <p className="font-regular text-muted-foreground mt-1 text-xs leading-none">
                  8 Members Registered
                </p>
              </motion.div>
            </div>

            <div className="flex items-center gap-3">
              {!isExpanded && (
                <div className="flex items-center gap-0">
                  <div className="flex -space-x-3">
                    {ALL_MEMBERS.slice(0, 3).map((m) => (
                      <motion.img
                        key={`sum-${m.id}`}
                        layoutId={`avatar-${m.id}`}
                        src={m.avatar}
                        className="ring-background z-1 h-10 w-10 rounded-full shadow-sm ring-1"
                        alt="avatar"
                      />
                    ))}
                    <div className="ring-background bg-muted relative z-0 flex h-10 w-10 items-center justify-center rounded-full shadow-sm ring-1">
                      <span className="font-regular text-muted-foreground text-sm leading-none">
                        +{ALL_MEMBERS.length - 3}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isExpanded && (
                <button
                  className="text-muted-foreground hover:text-foreground bg-muted/60 flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="px-6 py-4"
                >
                  <div className="relative">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      className="text-muted-foreground/50 absolute top-1/2 left-4 z-10 -translate-y-1/2"
                      size={15}
                    />
                    <Input
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-muted/30 focus-visible:ring-border text-foreground placeholder:text-muted-foreground/40 box-border h-10 w-full rounded-xl border-none pl-10 text-sm transition-all focus-visible:ring-1"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="custom-scrollbar scroll-visible flex-1 overflow-y-auto px-6 py-2">
              <motion.div
                initial="hidden"
                animate={isExpanded ? "visible" : "hidden"}
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
                  },
                  hidden: {
                    transition: { staggerChildren: 0.02, staggerDirection: -1 },
                  },
                }}
                className="space-y-0.5"
              >
                {filteredAllMembers.map((member) => (
                  <MemberItem key={`list-${member.id}`} member={member} />
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
