import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="from-background via-background to-muted/30 flex min-h-svh items-center justify-center bg-linear-to-br px-4 py-12">
      {children}
    </div>
  );
}
