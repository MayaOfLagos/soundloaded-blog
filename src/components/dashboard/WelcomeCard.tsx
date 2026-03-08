"use client";

import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WelcomeCardProps {
  name: string;
  email: string;
  image?: string | null;
  createdAt: string;
  role: string;
}

export function WelcomeCard({ name, email, image, createdAt, role }: WelcomeCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <Avatar className="h-16 w-16">
          {image && <AvatarImage src={image} alt={name} />}
          <AvatarFallback className={cn("bg-brand/20 text-brand text-lg font-semibold")}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{name}</h2>
            <Badge variant="secondary" className="capitalize">
              {role.toLowerCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{email}</p>
          <p className="text-muted-foreground text-xs">
            Member since {format(new Date(createdAt), "MMMM d, yyyy")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
