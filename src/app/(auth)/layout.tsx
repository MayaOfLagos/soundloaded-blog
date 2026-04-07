import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="from-background via-background to-muted/30 flex min-h-screen items-center justify-center bg-gradient-to-br px-4 py-12">
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}
