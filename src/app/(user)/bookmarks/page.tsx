import { redirect } from "next/navigation";

export default function BookmarksPage() {
  redirect("/library?tab=bookmarks");
}
