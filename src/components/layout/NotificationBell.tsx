"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, UserPlus, Heart, MessageCircle, Music, AlertCircle, Check } from "lucide-react";
import { useUnreadNotificationCount, useUserNotifications } from "@/hooks/useUserDashboard";
import { useMarkNotificationRead } from "@/hooks/useUserMutations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  NEW_FOLLOWER: { icon: UserPlus, color: "text-blue-500" },
  REACTION: { icon: Heart, color: "text-pink-500" },
  NEW_COMMENT: { icon: MessageCircle, color: "text-green-500" },
  COMMENT_REPLY: { icon: MessageCircle, color: "text-green-500" },
  NEW_MUSIC: { icon: Music, color: "text-purple-500" },
  REPORT_FILED: { icon: AlertCircle, color: "text-red-500" },
  REPORT_UPDATE: { icon: AlertCircle, color: "text-orange-500" },
  SYSTEM: { icon: Bell, color: "text-muted-foreground" },
};

function formatTimeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  } | null;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: notifData } = useUserNotifications(1);
  const markRead = useMarkNotificationRead();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!session?.user) return null;

  const notifications = (notifData?.notifications ?? []) as unknown as NotificationItem[];

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "hover:bg-muted/60 relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          open && "bg-muted"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="bg-card ring-border/40 absolute top-full right-0 mt-2 w-80 overflow-hidden rounded-xl shadow-lg ring-1 sm:w-96">
          {/* Header */}
          <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-foreground text-sm font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-brand h-7 gap-1.5 text-xs"
                onClick={() => markRead.mutate({ markAllRead: true })}
              >
                <Check className="h-3 w-3" /> Mark all read
              </Button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Bell className="text-muted-foreground/30 mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
                const Icon = config.icon;

                const content = (
                  <div
                    key={n.id}
                    className={cn(
                      "hover:bg-muted/50 flex items-start gap-3 px-4 py-3 transition-colors",
                      !n.read && "bg-brand/5"
                    )}
                    onClick={() => {
                      if (!n.read) markRead.mutate({ id: n.id });
                      setOpen(false);
                    }}
                  >
                    {/* Actor avatar or type icon */}
                    <div className="relative shrink-0">
                      {n.actor?.image ? (
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={n.actor.image} />
                          <AvatarFallback className="text-xs">
                            {n.actor.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-full">
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                      )}
                      {/* Type badge on avatar */}
                      {n.actor?.image && (
                        <div className="bg-card absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full">
                          <Icon className={cn("h-3 w-3", config.color)} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground line-clamp-2 text-[13px] leading-snug">
                        {n.body}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[11px]">
                        {formatTimeAgo(n.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && <div className="bg-brand mt-2 h-2 w-2 shrink-0 rounded-full" />}
                  </div>
                );

                if (n.link) {
                  return (
                    <Link key={n.id} href={n.link} className="block">
                      {content}
                    </Link>
                  );
                }
                return <div key={n.id}>{content}</div>;
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-border/50 border-t">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-brand hover:bg-muted/50 block py-2.5 text-center text-xs font-semibold transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
