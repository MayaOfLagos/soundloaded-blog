"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <WifiOff className="text-muted-foreground h-10 w-10" />
      </div>
      <h1 className="text-foreground text-2xl font-black">You&apos;re Offline</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        No internet connection detected. Pages you&apos;ve visited before are still available below.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={() => window.location.reload()}
          className="bg-brand hover:bg-brand/90 text-brand-foreground gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline">Go to Homepage</Button>
        </Link>
      </div>
      <p className="text-muted-foreground mt-8 text-xs">
        Previously cached pages will load normally once you reconnect.
      </p>
    </div>
  );
}
