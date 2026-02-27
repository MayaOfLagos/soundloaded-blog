import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 select-none", className)}>
      {/* Icon mark */}
      <div className="bg-brand text-brand-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-black">
        SL
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className="text-foreground text-base font-black tracking-tight">Soundloaded</span>
          <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
            Blog
          </span>
        </div>
      )}
    </Link>
  );
}
