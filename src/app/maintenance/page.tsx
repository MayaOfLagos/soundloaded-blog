import { getSettings } from "@/lib/settings";
import { Construction } from "lucide-react";

export default async function MaintenancePage() {
  const settings = await getSettings();

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="bg-brand/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Construction className="text-brand h-8 w-8" />
        </div>
        <h1 className="text-foreground text-2xl font-black">{settings.siteName}</h1>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
          {settings.maintenanceMessage}
        </p>
        <p className="text-muted-foreground mt-8 text-xs">
          &copy; {new Date().getFullYear()} {settings.copyrightText}
        </p>
      </div>
    </div>
  );
}
