"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";

interface EnvStatus {
  database: boolean;
  authSecret: boolean;
  cloudflareR2: boolean;
  r2MediaBucket: boolean;
  r2MusicBucket: boolean;
  resendApiKey: boolean;
  meilisearch: boolean;
  sentryDsn: boolean;
  upstashRedis: boolean;
  vercelAnalytics: boolean;
  umamiAnalytics: boolean;
  cdnUrl: boolean;
  musicCdnUrl: boolean;
}

const ENV_ITEMS: Array<{
  key: keyof EnvStatus;
  label: string;
  description: string;
  category: string;
}> = [
  {
    key: "database",
    label: "Database (PostgreSQL)",
    description: "DATABASE_URL",
    category: "Core",
  },
  {
    key: "authSecret",
    label: "Auth Secret",
    description: "AUTH_SECRET / NEXTAUTH_SECRET",
    category: "Core",
  },
  {
    key: "cloudflareR2",
    label: "Cloudflare R2 Credentials",
    description: "CLOUDFLARE_ACCOUNT_ID + R2 keys",
    category: "Storage",
  },
  {
    key: "r2MediaBucket",
    label: "R2 Media Bucket",
    description: "R2_MEDIA_BUCKET",
    category: "Storage",
  },
  {
    key: "r2MusicBucket",
    label: "R2 Music Bucket",
    description: "R2_MUSIC_BUCKET",
    category: "Storage",
  },
  { key: "cdnUrl", label: "CDN URL", description: "NEXT_PUBLIC_CDN_URL", category: "Storage" },
  {
    key: "musicCdnUrl",
    label: "Music CDN URL",
    description: "NEXT_PUBLIC_MUSIC_CDN_URL",
    category: "Storage",
  },
  {
    key: "resendApiKey",
    label: "Resend Email",
    description: "RESEND_API_KEY",
    category: "Services",
  },
  {
    key: "meilisearch",
    label: "Meilisearch",
    description: "MEILI_HOST + MEILI_MASTER_KEY",
    category: "Services",
  },
  {
    key: "upstashRedis",
    label: "Upstash Redis",
    description: "UPSTASH_REDIS_REST_URL + TOKEN",
    category: "Services",
  },
  {
    key: "sentryDsn",
    label: "Sentry Error Tracking",
    description: "SENTRY_DSN",
    category: "Monitoring",
  },
  {
    key: "vercelAnalytics",
    label: "Vercel Analytics",
    description: "VERCEL_ANALYTICS_ID",
    category: "Monitoring",
  },
  {
    key: "umamiAnalytics",
    label: "Umami Analytics",
    description: "NEXT_PUBLIC_UMAMI_WEBSITE_ID",
    category: "Monitoring",
  },
];

export function EnvironmentStatus() {
  const { data, isLoading, error } = useQuery<EnvStatus>({
    queryKey: ["env-status"],
    queryFn: () => adminApi.get("/api/admin/settings/env-status").then((r) => r.data),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-destructive py-6 text-sm">Failed to load environment status.</div>;
  }

  const categories = [...new Set(ENV_ITEMS.map((i) => i.category))];
  const configured = ENV_ITEMS.filter((i) => data[i.key]).length;
  const total = ENV_ITEMS.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Environment</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Status of configured environment variables (read-only)
        </p>
      </div>
      <Separator />

      <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4">
        <Shield className="text-brand h-5 w-5 shrink-0" />
        <div>
          <p className="text-foreground text-sm font-medium">
            {configured}/{total} services configured
          </p>
          <p className="text-muted-foreground text-xs">
            Environment variables are managed in your{" "}
            <code className="bg-muted rounded px-1">.env</code> file and are never stored in the
            database.
          </p>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-2">
          <h3 className="text-foreground text-sm font-semibold">{category}</h3>
          <div className="divide-y rounded-lg border">
            {ENV_ITEMS.filter((i) => i.category === category).map((item) => {
              const isConfigured = data[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-foreground text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground font-mono text-xs">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConfigured ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600">Configured</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="text-muted-foreground h-4 w-4" />
                        <span className="text-muted-foreground text-xs">Not set</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
