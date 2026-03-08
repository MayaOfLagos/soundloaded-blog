export function DetailLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <main className="min-w-0">{children}</main>
        {sidebar && (
          <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] space-y-5 overflow-y-auto pb-8 lg:block">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
