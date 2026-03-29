"use client";

import { use } from "react";
import { PlaylistDetailClient } from "./PlaylistDetailClient";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = use(params);
  return <PlaylistDetailClient playlistId={id} />;
}
