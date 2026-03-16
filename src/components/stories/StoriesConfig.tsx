"use client";

import { memo, useEffect, useRef } from "react";
import Image from "next/image";
import {
  InstaStories,
  Stories,
  Story,
  Preview,
  Pages,
  Page,
  Configurable,
} from "@react-instastories/base";
import { Controls, Events, Preloadable } from "@react-instastories/external";
import { StoryPageContent } from "./StoryPageContent";
import { cn } from "@/lib/utils";
import type { StoryGroupResponse } from "@/app/api/stories/route";

import "@react-instastories/base/index.css";
import "@react-instastories/external/index.css";
import "@react-instastories/presets/ig.css";
import "./stories.css";

/* Material Design SVGs matching the IG preset demo */
function IconClose() {
  return (
    <svg height="32" viewBox="0 0 24 24" width="32">
      <title>Close</title>
      <path
        d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        fill="#ffffff"
      />
    </svg>
  );
}

function IconPrev() {
  return (
    <svg height="24" viewBox="0 0 24 24" width="24">
      <title>Previous</title>
      <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="#000000" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg height="24" viewBox="0 0 24 24" width="24">
      <title>Next</title>
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="#000000" />
    </svg>
  );
}

const STORIES_CONFIG = {
  preset: "instastories-preset-ig" as const,
  animation: "immediately" as const,
  duration: 5000,
};

function ViewerConfigurable() {
  return (
    <Configurable.Container>
      <Configurable.Viewer
        events={[
          Events.Keyboard.Close,
          Events.Keyboard.Stories,
          Events.Keyboard.Pages,
          Events.Focus.Timer,
          Events.Mount.AutoClose,
        ]}
      >
        <Controls.Viewer.Close>
          <IconClose />
        </Controls.Viewer.Close>
        <Controls.Viewer.Background />
        <Preloadable.Stories next={1} previous={1} />
      </Configurable.Viewer>
      <Configurable.Story events={[Events.Pointer.Timer]}>
        <Controls.Indicator interactive />
      </Configurable.Story>
      <Configurable.Page>
        <Controls.Viewer.Close>
          <IconClose />
        </Controls.Viewer.Close>
        <Controls.Pages.Previous>
          <IconPrev />
        </Controls.Pages.Previous>
        <Controls.Pages.Next>
          <IconNext />
        </Controls.Pages.Next>
      </Configurable.Page>
    </Configurable.Container>
  );
}

const StoryCard = memo(function StoryCard({
  group,
  ...storyProps
}: {
  group: StoryGroupResponse;
  [key: string]: unknown;
}) {
  const firstStory = group.stories[0];
  const coverUrl = firstStory?.type !== "TEXT" ? firstStory?.mediaUrl : undefined;
  const coverBg =
    firstStory?.backgroundColor ?? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  return (
    <Story {...storyProps}>
      <Preview className={cn(group.hasUnviewed ? "story-card-unseen" : "story-card-seen")}>
        {coverUrl ? (
          firstStory?.type === "VIDEO" ? (
            <video src={coverUrl} autoPlay loop muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={group.author.name ?? "Story"} />
          )
        ) : null}

        {/* Overlay content */}
        <div
          className="absolute inset-0 z-[1] flex flex-col justify-end p-2.5"
          style={!coverUrl ? { background: coverBg } : undefined}
        >
          {/* Dark gradient at bottom for text readability */}
          {coverUrl && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          )}

          {/* Text story preview */}
          {firstStory?.type === "TEXT" && firstStory.textContent && (
            <p className="absolute inset-0 flex items-center justify-center p-3 text-center text-[10px] leading-tight font-semibold text-white">
              {firstStory.textContent.slice(0, 80)}
              {(firstStory.textContent.length ?? 0) > 80 ? "…" : ""}
            </p>
          )}

          {/* Avatar + name at bottom-left */}
          <div className="relative z-[2] flex items-center gap-1.5">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-blue-500">
              {group.author.image ? (
                <Image
                  src={group.author.image}
                  alt={group.author.name ?? ""}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/20 text-[10px] font-bold text-white">
                  {group.author.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <span className="truncate text-[11px] font-semibold text-white drop-shadow-sm">
              {group.author.name ?? "User"}
            </span>
          </div>
        </div>
      </Preview>
      <Pages>
        {group.stories.map((item) => (
          <Page key={item.id} duration={item.duration * 1000}>
            <StoryPageContent item={item} author={group.author} />
          </Page>
        ))}
      </Pages>
    </Story>
  );
});

interface StoriesPlayerProps {
  groups: StoryGroupResponse[];
  autoOpen?: boolean;
}

export function StoriesPlayer({ groups, autoOpen }: StoriesPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-click the first preview button to open the story viewer directly
  useEffect(() => {
    if (!autoOpen) return;
    // Wait for the library to render the preview buttons
    const raf = requestAnimationFrame(() => {
      const firstPreview = containerRef.current?.querySelector<HTMLButtonElement>(
        '[data-testid="is-preview"]'
      );
      firstPreview?.click();
    });
    return () => cancelAnimationFrame(raf);
  }, [autoOpen]);

  return (
    <div ref={containerRef}>
      <InstaStories config={STORIES_CONFIG}>
        <ViewerConfigurable />
        <Stories>
          {groups.map((group) => (
            <StoryCard key={group.author.id} group={group} />
          ))}
        </Stories>
      </InstaStories>
    </div>
  );
}
