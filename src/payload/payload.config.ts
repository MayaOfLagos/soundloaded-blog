import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import path from "path";
import { fileURLToPath } from "url";
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Tags } from "./collections/Tags";
import { Posts } from "./collections/Posts";
import { Artists } from "./collections/Artists";
import { Albums } from "./collections/Albums";
import { MusicCollection } from "./collections/Music";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "users",
    meta: {
      titleSuffix: "— Soundloaded Blog CMS",
    },
  },
  collections: [Users, Media, Categories, Tags, Posts, Artists, Albums, MusicCollection],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET ?? "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  plugins: [
    s3Storage({
      collections: {
        media: { prefix: "media" },
      },
      bucket: process.env.R2_MEDIA_BUCKET ?? "soundloadedblog-media",
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
        },
        region: "auto",
        endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      },
    }),
  ],
  cors: [process.env.NEXT_PUBLIC_APP_URL ?? "https://soundloaded.ng"],
  csrf: [process.env.NEXT_PUBLIC_APP_URL ?? "https://soundloaded.ng"],
  globals: [],
});
