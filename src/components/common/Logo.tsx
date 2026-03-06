import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  siteName?: string;
}

export function Logo({
  className,
  iconOnly = false,
  logoLightUrl,
  logoDarkUrl,
  siteName = "Soundloaded",
}: LogoProps) {
  const hasLogo = logoLightUrl || logoDarkUrl;

  return (
    <Link href="/" className={cn("flex items-center gap-2 select-none", className)}>
      {hasLogo ? (
        <>
          {/* Light mode logo (hidden in dark mode) */}
          {logoLightUrl && (
            <Image
              src={logoLightUrl}
              alt={siteName}
              width={140}
              height={36}
              className="h-8 w-auto object-contain dark:hidden"
              unoptimized
            />
          )}
          {/* Dark mode logo (hidden in light mode) */}
          {logoDarkUrl && (
            <Image
              src={logoDarkUrl}
              alt={siteName}
              width={140}
              height={36}
              className="hidden h-8 w-auto object-contain dark:block"
              unoptimized
            />
          )}
          {/* Fallback: if only one logo variant exists, show it in both modes */}
          {logoLightUrl && !logoDarkUrl && (
            <Image
              src={logoLightUrl}
              alt={siteName}
              width={140}
              height={36}
              className="hidden h-8 w-auto object-contain dark:block"
              unoptimized
            />
          )}
          {!logoLightUrl && logoDarkUrl && (
            <Image
              src={logoDarkUrl}
              alt={siteName}
              width={140}
              height={36}
              className="h-8 w-auto object-contain dark:hidden"
              unoptimized
            />
          )}
        </>
      ) : (
        <>
          {/* Default text logo */}
          <div className="bg-brand text-brand-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-black">
            SL
          </div>
          {!iconOnly && (
            <div className="flex flex-col leading-none">
              <span className="text-foreground text-base font-black tracking-tight">
                {siteName}
              </span>
              <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                Blog
              </span>
            </div>
          )}
        </>
      )}
    </Link>
  );
}
