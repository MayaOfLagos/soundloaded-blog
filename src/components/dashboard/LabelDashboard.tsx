import {
  CreatorAnalyticsSummary,
  CreatorActionQueue,
  CreatorHero,
  CreatorProfileReadiness,
  CreatorRosterPreview,
  CreatorStatsGrid,
  CreatorTrackList,
} from "@/components/dashboard/CreatorCommandCenter";
import { getCreatorAnalyticsReport } from "@/lib/creator-analytics";
import { getLabelCommandCenter } from "@/lib/creator-command-center";

type LabelProfile = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  logo: string | null;
  coverImage?: string | null;
  country?: string | null;
  website?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  spotify?: string | null;
  appleMusic?: string | null;
  verified: boolean;
  _count: { artists: number };
};

export async function LabelDashboard({ label }: { label: LabelProfile; userId?: string }) {
  const [commandCenter, analytics] = await Promise.all([
    getLabelCommandCenter(label),
    getCreatorAnalyticsReport({
      scope: { type: "label", id: label.id, name: label.name },
      days: 30,
    }),
  ]);

  return (
    <main className="min-w-0 space-y-5">
      <CreatorHero
        title="Label Command Center"
        name={label.name}
        description="Watch roster quality, release health, audience movement, and paid download signals together."
        image={label.logo}
        imageAlt={label.name}
        verified={label.verified}
        primaryActionHref="/dashboard/label-artists"
        primaryActionLabel="Manage artists"
        secondaryActionHref="/dashboard/label-profile"
        secondaryActionLabel="Edit label"
      />

      <CreatorStatsGrid stats={commandCenter.stats} />

      <CreatorAnalyticsSummary analytics={analytics} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <CreatorActionQueue actions={commandCenter.actions} />
        <CreatorProfileReadiness
          score={commandCenter.profileScore}
          items={commandCenter.profileChecklist}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CreatorTrackList
          title="Top Roster Tracks"
          href="/dashboard/releases"
          tracks={commandCenter.topTracks}
          emptyLabel="Roster releases will appear here"
        />
        <CreatorRosterPreview
          artists={commandCenter.recentArtists}
          href="/dashboard/label-artists"
        />
      </div>
    </main>
  );
}
