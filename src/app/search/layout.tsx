import { getSettings } from "@/lib/settings";
import { SectionDisabled } from "@/components/common/SectionDisabled";

export default async function SearchLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  if (!settings.enableSearch) return <SectionDisabled section="Search" />;
  return <>{children}</>;
}
