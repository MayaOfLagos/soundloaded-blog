import { getSettings } from "@/lib/settings";
import { SectionDisabled } from "@/components/common/SectionDisabled";
import { MusicLeftSidebar } from "@/components/music/MusicLeftSidebar";

export default async function SearchLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  if (!settings.enableSearch) return <SectionDisabled section="Search" />;
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <MusicLeftSidebar />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
