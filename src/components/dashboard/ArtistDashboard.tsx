import {
  CreatorAnalyticsSummary,
  CreatorActionQueue,
  CreatorHero,
  CreatorInsightPanel,
  CreatorProfileReadiness,
  CreatorPromotionKit,
  CreatorStatsGrid,
  CreatorTrackList,
} from "@/components/dashboard/CreatorCommandCenter";
import { getCreatorAnalyticsReport } from "@/lib/creator-analytics";
import { getArtistCommandCenter } from "@/lib/creator-command-center";
import { getSettings } from "@/lib/settings";

type ArtistProfile = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo: string | null;
  coverImage?: string | null;
  country?: string | null;
  genre?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  spotify?: string | null;
  appleMusic?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  soundcloud?: string | null;
  boomplay?: string | null;
  website?: string | null;
  verified: boolean;
  _count: { music: number; albums: number; artistFollows: number };
};

export async function ArtistDashboard({ artist }: { artist: ArtistProfile; userId?: string }) {
  const [commandCenter, analytics, settings] = await Promise.all([
    getArtistCommandCenter(artist),
    getCreatorAnalyticsReport({
      scope: { type: "artist", id: artist.id, name: artist.name },
      days: 30,
    }),
    getSettings(),
  ]);

  return (
    <main className="min-w-0 space-y-5">
      <CreatorHero
        title="Artist Command Center"
        name={artist.name}
        description="Track release health, profile quality, audience growth, and money signals from one place."
        image={artist.photo}
        imageAlt={artist.name}
        verified={artist.verified}
        primaryActionHref="/dashboard/music"
        primaryActionLabel="Upload music"
        secondaryActionHref="/dashboard/artist-profile"
        secondaryActionLabel="Edit profile"
      />

      <CreatorStatsGrid stats={commandCenter.stats} />

      <CreatorAnalyticsSummary analytics={analytics} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <CreatorPromotionKit
          tracks={
            commandCenter.topTracks.length > 0
              ? commandCenter.topTracks
              : commandCenter.recentTracks
          }
          analytics={analytics}
          siteUrl={settings.siteUrl}
          emptyHref="/dashboard/music"
          emptyLabel="Upload a release to unlock promotion links and share artwork"
        />
        <CreatorInsightPanel
          analytics={analytics}
          health={commandCenter.health}
          profileScore={commandCenter.profileScore}
          scopeType="artist"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <CreatorActionQueue actions={commandCenter.actions} />
        <CreatorProfileReadiness
          score={commandCenter.profileScore}
          items={commandCenter.profileChecklist}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CreatorTrackList
          title="Top Tracks"
          href="/dashboard/music"
          tracks={commandCenter.topTracks}
          emptyLabel="Upload music to start building your performance chart"
        />
        <CreatorTrackList
          title="Recent Releases"
          href="/dashboard/music"
          tracks={commandCenter.recentTracks}
          emptyLabel="No releases yet"
        />
      </div>
    </main>
  );
}
