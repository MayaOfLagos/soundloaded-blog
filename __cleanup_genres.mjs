import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function merge(sources, target) {
  const { count } = await db.music.updateMany({
    where: { genre: { in: sources } },
    data: { genre: target },
  });
  if (count > 0) console.log(`  ✓ Merged ${sources.length} variants → "${target}" (${count} tracks)`);
}

async function rename(from, to) {
  const { count } = await db.music.updateMany({
    where: { genre: from },
    data: { genre: to },
  });
  if (count > 0) console.log(`  ✓ Renamed "${from}" → "${to}" (${count} tracks)`);
}

async function clear(genres) {
  const { count } = await db.music.updateMany({
    where: { genre: { in: genres } },
    data: { genre: null },
  });
  if (count > 0) console.log(`  ✓ Cleared ${genres.length} junk genre(s) (${count} tracks → null)`);
}

console.log("\n── Normalising Afrobeats ──");
await merge(
  ["Afrobeat", "AfroBeats", "Afro-Beat", "AfroBeat", "Afroabeats", "Afro the beat"],
  "Afrobeats"
);
// "Afrobeats, Afropops" → treat as Afropop (mixed tag)
await rename("Afrobeats, Afropops", "Afropop");

console.log("\n── Normalising Afropop ──");
await merge(["Afro-Pop", "Afro Pop", "Afro-pop", "Afro pop"], "Afropop");

console.log("\n── Normalising Hip-Hop ──");
await merge(["Hip Hop", "Hip-hop", "Hip Hop/Rap", "Afro Hip Hop"], "Hip-Hop");

console.log("\n── Normalising Rap ──");
await merge(["RAP SONG", "street rap"], "Rap");

console.log("\n── Normalising World Music ──");
await rename("World", "World Music");
await rename("Bongo Flava", "World Music");

console.log("\n── Normalising Pop ──");
await merge(["Pop/Funk", "Pop Culture"], "Pop");

console.log("\n── Normalising Gospel ──");
await rename("Fuji, Gospel Song", "Gospel");

console.log("\n── Normalising Dance ──");
await rename(" Dance", "Dance");          // leading space
await rename("Dance Hall", "Dancehall");

console.log("\n── Normalising TrapFro ──");
await rename("Trapfro", "TrapFro");

console.log("\n── Normalising Freestyle ──");
await rename("freestyle", "Freestyle");

console.log("\n── Fixing leading-space genres ──");
await rename(" New Age", "New Age");

console.log("\n── Clearing junk (website names, garbage values) ──");
await clear([
  "MillaMix.org",
  "PaglaSongs.Com",
  "360Loaded.com",
  "Soundoaded.com.ng",
  "abegmusic.com",
  "Themidemedia.com",
  "Twitter:-OFICIAL_NL",
  "3",
  "        ",          // whitespace blob
  "Chorus",
  "Disc Jockey Mix tape",
  "dj mixtape",
  "Mixtapes",
  "Other",
]);

console.log("\n── Final genre list ──");
const rows = await db.music.groupBy({
  by: ["genre"],
  _count: { id: true },
  orderBy: { _count: { id: "desc" } },
});
rows.forEach((r) => console.log(`  ${r._count.id}\t${r.genre ?? "(null)"}`));

await db.$disconnect();
console.log("\nDone.");
