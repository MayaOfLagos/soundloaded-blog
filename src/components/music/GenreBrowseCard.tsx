import Link from "next/link";
import { cn } from "@/lib/utils";

interface GenreBrowseCardProps {
  label: string;
  href: string;
  gradient: string;
}

export function GenreBrowseCard({ label, href, gradient }: GenreBrowseCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-28 items-end overflow-hidden rounded-xl bg-gradient-to-br p-4 shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl sm:h-32",
        gradient
      )}
    >
      {/* Decorative circle — top right, like Spotify's tilted album art */}
      <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/5" />

      {/* Genre name */}
      <h3 className="relative z-10 text-lg leading-tight font-extrabold tracking-tight text-white drop-shadow-md sm:text-xl">
        {label}
      </h3>
    </Link>
  );
}
