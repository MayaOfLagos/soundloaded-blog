import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const rows = await db.music.groupBy({
  by: ["genre"],
  _count: { id: true },
  orderBy: { _count: { id: "desc" } },
});
rows.forEach(r => console.log(r._count.id + "\t" + (r.genre ?? "(null)")));
await db.$disconnect();
