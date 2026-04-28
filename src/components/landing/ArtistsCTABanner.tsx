import Link from "next/link";
import { ArrowRight, Mic2, Sparkles } from "lucide-react";

export function ArtistsCTABanner() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10 lg:rounded-[2rem]">
          {/* Layered gradient backdrop */}
          <div className="absolute inset-0 bg-[#0d0518]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_20%_30%,rgba(217,70,239,0.35),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_80%_70%,rgba(251,191,36,0.20),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_50%_100%,rgba(168,85,247,0.18),transparent_70%)]" />

          {/* Decorative floating note icons */}
          <Mic2
            className="absolute top-8 right-8 h-20 w-20 text-white/5 sm:h-28 sm:w-28"
            aria-hidden="true"
          />
          <Sparkles
            className="absolute bottom-8 left-8 h-12 w-12 text-white/10 sm:h-16 sm:w-16"
            aria-hidden="true"
          />

          <div className="relative grid items-center gap-8 px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:px-16 lg:py-20">
            <div className="flex flex-col gap-5 lg:gap-6">
              <div className="ring-brand/40 bg-brand/15 text-brand inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wider uppercase ring-1 backdrop-blur sm:text-xs">
                <Sparkles className="h-3 w-3" />
                For Artists
              </div>

              <h2 className="text-3xl leading-[1.1] font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Get heard. Get streamed.{" "}
                <span className="bg-linear-to-r from-fuchsia-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
                  Get paid.
                </span>
              </h2>

              <p className="max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Soundloaded is built for upcoming Naija artists. Distribute your music, build a
                fanbase, and grow your sound — no label required.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 lg:flex-col lg:items-stretch">
              <Link
                href="/api/enter?next=/dashboard/music/upload"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-fuchsia-500 to-amber-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] sm:text-base"
              >
                Submit Your Music
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/api/enter?next=/dashboard/artist/verify"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-white/45 hover:bg-white/15 sm:text-base"
              >
                Become Verified
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
