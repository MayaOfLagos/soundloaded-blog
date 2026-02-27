import Link from "next/link";
import { Home, Music, Newspaper, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6">
        <span className="text-brand text-8xl font-black">404</span>
      </div>

      <h1 className="text-foreground mb-2 text-2xl font-black">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        This page doesn&apos;t exist or may have been moved. Check out some of these instead:
      </p>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        {[
          { href: "/music", label: "Free Downloads", icon: Music },
          { href: "/news", label: "Music News", icon: Newspaper },
          { href: "/gist", label: "Gist", icon: MessageSquare },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button variant="outline" className="gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
      </div>

      <Link href="/">
        <Button className="bg-brand hover:bg-brand/90 text-brand-foreground gap-2">
          <Home className="h-4 w-4" />
          Go to Homepage
        </Button>
      </Link>
    </div>
  );
}
