"use client";

import { useState } from "react";
import { useUserNotifications } from "@/hooks/useUserDashboard";
import { useMarkNotificationRead } from "@/hooks/useUserMutations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  MessageSquare,
  Music,
  CreditCard,
  AlertCircle,
  Check,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  COMMENT_REPLY: MessageSquare,
  NEW_MUSIC: Music,
  SUBSCRIPTION_REMINDER: CreditCard,
  SYSTEM: AlertCircle,
  DOWNLOAD_READY: Check,
};

function getNotificationIcon(type: string, className: string) {
  const Icon = NOTIFICATION_ICONS[type] || Bell;
  return <Icon className={className} />;
}

function getGroup(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This Week";
  return "Older";
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

function groupNotifications(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {};
  const order = ["Today", "Yesterday", "This Week", "Older"];

  for (const notification of notifications) {
    const group = getGroup(new Date(notification.createdAt));
    if (!groups[group]) groups[group] = [];
    groups[group].push(notification);
  }

  return order
    .filter((key) => groups[key]?.length)
    .map((key) => ({ label: key, items: groups[key] }));
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-32" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
          <div className="flex items-start gap-3 p-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const isUnread = !notification.readAt;

  const content = (
    <div
      className={`bg-card/50 hover:bg-muted/50 cursor-pointer rounded-2xl ring-1 backdrop-blur-sm transition-colors ${
        isUnread ? "ring-brand/40" : "ring-border/40"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isUnread
              ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {getNotificationIcon(notification.type, "h-4 w-4")}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>
            {notification.title}
          </p>
          {notification.body && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{notification.body}</p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        {isUnread && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
      </div>
    </div>
  );

  const handleClick = () => {
    if (isUnread) {
      onMarkRead(notification.id);
    }
  };

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return <div onClick={handleClick}>{content}</div>;
}

export function NotificationsView() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUserNotifications(page);
  const markNotificationRead = useMarkNotificationRead();

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  const notifications = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (notifications.length === 0 && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Bell className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold">All caught up!</h3>
        <p className="text-muted-foreground mt-1 text-sm">You have no notifications right now</p>
      </div>
    );
  }

  const grouped = groupNotifications(notifications);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => markNotificationRead.mutate({ markAllRead: true })}
          disabled={markNotificationRead.isPending}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      {/* Grouped notifications */}
      {grouped.map((group) => (
        <div key={group.label}>
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.items.map((notification: Notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => markNotificationRead.mutate({ id })}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
