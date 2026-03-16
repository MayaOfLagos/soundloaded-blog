import Link from "next/link";

interface SectionDisabledProps {
  section: string;
}

export function SectionDisabled({ section }: SectionDisabledProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-muted/50 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-muted-foreground h-10 w-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>
      <h1 className="text-foreground text-2xl font-bold">{section} is currently unavailable</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        This section has been temporarily disabled by the site administrator. Please check back
        later.
      </p>
      <Link
        href="/"
        className="bg-brand text-brand-foreground hover:bg-brand/90 mt-6 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
      >
        Go back home
      </Link>
    </div>
  );
}
