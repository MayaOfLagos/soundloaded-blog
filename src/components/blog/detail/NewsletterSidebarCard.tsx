import { Mail } from "lucide-react";
import { NewsletterForm } from "@/components/common/NewsletterForm";

export function NewsletterSidebarCard() {
  return (
    <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
      <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
        <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
          <Mail className="text-brand h-3.5 w-3.5" />
        </div>
        <h3 className="text-foreground text-sm font-bold">Stay Updated</h3>
      </div>
      <div className="p-4">
        <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
          Get the latest music news, downloads & gist delivered to your inbox.
        </p>
        <NewsletterForm compact />
      </div>
    </div>
  );
}
