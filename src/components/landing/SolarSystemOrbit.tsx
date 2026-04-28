import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

type OrbitArtist = {
  id: string;
  slug: string;
  name: string;
  photo?: string | null;
};

type Belt = {
  /** Distance from center in px. Belt ring CSS class must match this radius. */
  radius: number;
  /** One full revolution duration. */
  duration: number;
  direction: "cw" | "ccw";
  artists: OrbitArtist[];
};

// Belt radii must stay in sync with .belt-ring-N widths in solar-system-orbit.css
const BELTS_BASE: Omit<Belt, "artists">[] = [
  { radius: 85, duration: 8, direction: "cw" },
  { radius: 135, duration: 12, direction: "ccw" },
  { radius: 185, duration: 16, direction: "cw" },
  { radius: 235, duration: 22, direction: "ccw" },
];

const PER_BELT = 3;

export function SolarSystemOrbit({
  artists,
  centerLogo,
  siteName,
}: {
  artists: OrbitArtist[];
  centerLogo?: string | null;
  siteName: string;
}) {
  // Only orbit artists with a profile photo
  const pool = artists.filter((a) => !!a.photo);

  // Distribute artists across all belts with an angular offset per belt.
  // When the pool is smaller than 12, artists cycle — but each belt picks
  // a different starting offset so the same artist never sits at the same
  // angle across belts. With a pool of 1, every slot shows that artist.
  const belts: Belt[] = BELTS_BASE.map((base, beltIdx) => ({
    ...base,
    artists:
      pool.length === 0
        ? []
        : Array.from({ length: PER_BELT }, (_, slotIdx) => {
            const offset = (beltIdx + slotIdx) % pool.length;
            return pool[offset];
          }),
  }));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-105 sm:max-w-120 lg:max-w-140">
      {/* Visible belt rings */}
      {belts.map((_, idx) => (
        <div key={`ring-${idx}`} aria-hidden="true" className={`belt-ring belt-ring-${idx}`} />
      ))}

      {/* Center radial glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.35)_0%,rgba(168,85,247,0.15)_45%,transparent_75%)] blur-2xl" />

      {/* Artist arms — avatars locked to the ring line */}
      {belts.map((belt, beltIdx) =>
        belt.artists.map((artist, idx) => {
          const startAngle = (idx / belt.artists.length) * 360;
          return (
            <ArtistArm
              key={artist.id}
              artist={artist}
              radius={belt.radius}
              duration={belt.duration}
              direction={belt.direction}
              startAngle={startAngle}
              accent={beltIdx}
            />
          );
        })
      )}

      {/* Center sun (logo) */}
      <div className="absolute top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-24 w-24 rounded-full bg-linear-to-br from-fuchsia-500/40 via-purple-500/35 to-amber-300/25 p-1 shadow-[0_0_60px_rgba(217,70,239,0.5)] sm:h-28 sm:w-28">
          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-black/85 backdrop-blur-xl">
            {centerLogo ? (
              <Image
                src={centerLogo}
                alt={siteName}
                width={110}
                height={40}
                className="max-h-10 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-black tracking-tight text-white">{siteName}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ACCENTS = [
  { ring: "border-fuchsia-300/60", glow: "shadow-[0_0_22px_rgba(217,70,239,0.5)]" },
  { ring: "border-purple-300/55", glow: "shadow-[0_0_22px_rgba(168,85,247,0.45)]" },
  { ring: "border-violet-300/55", glow: "shadow-[0_0_22px_rgba(139,92,246,0.45)]" },
  { ring: "border-amber-300/55", glow: "shadow-[0_0_22px_rgba(251,191,36,0.45)]" },
] as const;

function ArtistArm({
  artist,
  radius,
  duration,
  direction,
  startAngle,
  accent,
}: {
  artist: OrbitArtist;
  radius: number;
  duration: number;
  direction: "cw" | "ccw";
  startAngle: number;
  accent: number;
}) {
  const armClass = direction === "cw" ? "orbit-arm-cw" : "orbit-arm-ccw";
  const cardClass = direction === "cw" ? "orbit-card-ccw" : "orbit-card-cw";
  const a = ACCENTS[accent % ACCENTS.length];

  // Negative animation-delay phase-shifts the start position around the orbit.
  const armVars = {
    "--orbit-duration": `${duration}s`,
    "--orbit-delay": `-${(startAngle / 360) * duration}s`,
  } as CSSProperties;

  const cardVars = {
    "--orbit-radius": `${radius}px`,
    "--orbit-duration": `${duration}s`,
    "--orbit-delay": `-${(startAngle / 360) * duration}s`,
  } as CSSProperties;

  return (
    <div className={`orbit-arm ${armClass}`} style={armVars}>
      <div className={`orbit-card ${cardClass}`} style={cardVars}>
        <Link
          href={`/artists/${artist.slug}`}
          aria-label={artist.name}
          title={artist.name}
          className={`group relative block h-14 w-14 overflow-hidden rounded-full border-2 ${a.ring} bg-white/10 ${a.glow} backdrop-blur-xl transition-transform duration-300 hover:scale-110`}
        >
          {artist.photo ? (
            <Image
              src={artist.photo}
              alt={artist.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : null}
        </Link>
      </div>
    </div>
  );
}
