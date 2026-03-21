import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArtistApplicationForm } from "./ArtistApplicationForm";
import { Clock, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Apply as Artist — Soundloaded",
  description: "Apply to manage your music and profile on Soundloaded.",
};

export default async function ApplyArtistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Check if already has an artist/label profile
  const [artistProfile, labelProfile] = await Promise.all([
    db.artist.findUnique({ where: { ownerId: userId }, select: { id: true } }),
    db.label.findUnique({ where: { ownerId: userId }, select: { id: true } }),
  ]);

  if (artistProfile || labelProfile) {
    redirect("/dashboard");
  }

  // Check for existing application
  const existingApp = await db.creatorApplication.findFirst({
    where: { userId, status: { in: ["PENDING", "REJECTED"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-foreground text-2xl font-bold">Apply as Artist</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Submit your application to manage your music and artist profile on Soundloaded.
        </p>
      </div>

      {existingApp?.status === "PENDING" ? (
        <div className="bg-card/50 ring-border/40 rounded-2xl p-8 text-center ring-1 backdrop-blur-sm">
          <Clock className="text-brand mx-auto h-12 w-12" />
          <h2 className="text-foreground mt-4 text-lg font-semibold">Application Under Review</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Your application for <strong>&quot;{existingApp.displayName}&quot;</strong> is being
            reviewed. We&apos;ll notify you once a decision is made.
          </p>
          <p className="text-muted-foreground/60 mt-4 text-xs">
            Submitted {new Date(existingApp.createdAt).toLocaleDateString()}
          </p>
        </div>
      ) : existingApp?.status === "REJECTED" ? (
        <div className="space-y-6">
          <div className="bg-card/50 ring-border/40 rounded-2xl p-6 ring-1 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
              <div>
                <h2 className="text-foreground font-semibold">Previous Application Not Approved</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Your application for &quot;{existingApp.displayName}&quot; was not approved.
                  {existingApp.reviewNote && (
                    <span className="mt-1 block">
                      <strong>Note:</strong> {existingApp.reviewNote}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <ArtistApplicationForm />
        </div>
      ) : (
        <ArtistApplicationForm />
      )}
    </div>
  );
}
