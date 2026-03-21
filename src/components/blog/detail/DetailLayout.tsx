export function DetailLayout({
  children,
  sidebar,
  leftSidebar,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  leftSidebar?: React.ReactNode;
}) {
  const hasLeft = !!leftSidebar;
  const hasRight = !!sidebar;

  // 3-col when both sidebars, 2-col when one, 1-col on mobile
  const gridCols =
    hasLeft && hasRight
      ? "lg:grid-cols-[240px_1fr_300px]"
      : hasRight
        ? "lg:grid-cols-[1fr_300px]"
        : hasLeft
          ? "lg:grid-cols-[240px_1fr]"
          : "";

  return (
    <div className={`mx-auto px-4 py-6 sm:px-6 ${hasLeft ? "max-w-[1320px]" : "max-w-[1100px]"}`}>
      <div className={`grid grid-cols-1 gap-8 ${gridCols}`}>
        {hasLeft && (
          <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] overflow-y-auto pb-8 lg:block">
            {leftSidebar}
          </aside>
        )}
        <main className="min-w-0">{children}</main>
        {hasRight && (
          <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] space-y-5 overflow-y-auto pb-8 lg:block">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
