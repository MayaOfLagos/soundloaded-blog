"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { adminApi, getApiError } from "@/lib/admin-api";
import { Users, Loader2, UserPlus, RefreshCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

type UserRole = "READER" | "CONTRIBUTOR" | "EDITOR" | "ADMIN" | "SUPER_ADMIN";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  createdAt: string;
  _count?: { posts: number; comments: number };
}

const ROLE_COLORS: Record<UserRole, string> = {
  READER: "bg-muted text-muted-foreground border-border",
  CONTRIBUTOR: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  EDITOR: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  ADMIN: "bg-brand/10 text-brand border-brand/20",
  SUPER_ADMIN: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const ROLES: UserRole[] = ["READER", "CONTRIBUTOR", "EDITOR", "ADMIN", "SUPER_ADMIN"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("EDITOR");
  const [isInviting, setIsInviting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const res = await adminApi.get<{ users: User[] }>("/api/admin/users?includeCounts=true");
      setUsers(res.data.users ?? []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingRole(userId);
    try {
      await adminApi.patch(`/api/admin/users/${userId}`, { role: newRole });
      toast.success("Role updated");
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    setIsInviting(true);
    try {
      await adminApi.post("/api/admin/users/invite", { email: inviteEmail, role: inviteRole });
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("EDITOR");
    } catch (err) {
      toast.error(getApiError(err, "Failed to send invite"));
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Users</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {users.length} team member{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadUsers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" /> Invite User
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <Badge
            key={role}
            variant="outline"
            className={`text-[10px] uppercase ${ROLE_COLORS[role]}`}
          >
            {role.replace("_", " ")}
          </Badge>
        ))}
      </div>

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No users found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Posts</TableHead>
                <TableHead className="text-center">Comments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-40 text-right">Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
                        <AvatarFallback className="bg-brand/10 text-brand text-xs">
                          {(user.name ?? user.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          {user.name ?? "Unnamed"}
                        </p>
                        <p className="text-muted-foreground text-xs">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase ${ROLE_COLORS[user.role]}`}
                    >
                      {user.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-foreground text-sm">{user._count?.posts ?? 0}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-foreground text-sm">{user._count?.comments ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {formatDate(user.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {updatingRole === user.id ? (
                        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}
                          disabled={user.role === "SUPER_ADMIN"}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">
                                {r.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="editor@soundloaded.ng"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                <SelectTrigger id="inviteRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter((r) => r !== "SUPER_ADMIN").map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-muted-foreground text-xs">
              An invitation email will be sent via Resend with a sign-up link.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={isInviting}
              className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5"
            >
              {isInviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isInviting ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
