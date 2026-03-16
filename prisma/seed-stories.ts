/**
 * Seed script: Create 20 test users + 5 stories each (100 stories total)
 * Uses Unsplash images uploaded through R2.
 *
 * Run: npx tsx prisma/seed-stories.ts
 */

import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

// ── Config ──

const db = new PrismaClient();

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET ?? "soundloadedblog-media";
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL ?? "";
const PASSWORD = "Password123!";
const STORY_EXPIRY_DAYS = 7;

function getMediaUrl(key: string) {
  return `${CDN_URL}/${key}`;
}

// ── 20 Users ──

const USERS = [
  {
    name: "Adaeze Okafor",
    email: "user1@example.com",
    role: "CONTRIBUTOR",
    bio: "Afrobeats producer & vocalist from Lagos",
    location: "Lagos, Nigeria",
  },
  {
    name: "Chidi Emenike",
    email: "user2@example.com",
    role: "READER",
    bio: "Music lover and playlist curator",
    location: "Abuja, Nigeria",
  },
  {
    name: "Folake Adeyemi",
    email: "user3@example.com",
    role: "CONTRIBUTOR",
    bio: "Gospel singer and worship leader",
    location: "Ibadan, Nigeria",
  },
  {
    name: "Kwame Asante",
    email: "user4@example.com",
    role: "READER",
    bio: "Highlife enthusiast from Accra",
    location: "Accra, Ghana",
  },
  {
    name: "Amara Diallo",
    email: "user5@example.com",
    role: "READER",
    bio: "Discovering new African sounds daily",
    location: "Dakar, Senegal",
  },
  {
    name: "Tunde Bakare",
    email: "user6@example.com",
    role: "CONTRIBUTOR",
    bio: "DJ and music journalist",
    location: "Lagos, Nigeria",
  },
  {
    name: "Ngozi Nwosu",
    email: "user7@example.com",
    role: "READER",
    bio: "R&B and soul lover",
    location: "Port Harcourt, Nigeria",
  },
  {
    name: "Emeka Obi",
    email: "user8@example.com",
    role: "READER",
    bio: "Hip-hop head since day one",
    location: "Enugu, Nigeria",
  },
  {
    name: "Aisha Mohammed",
    email: "user9@example.com",
    role: "READER",
    bio: "Northern vibes, fuji & juju fan",
    location: "Kano, Nigeria",
  },
  {
    name: "Yemi Alade-Fan",
    email: "user10@example.com",
    role: "CONTRIBUTOR",
    bio: "Concert photographer and blogger",
    location: "Lagos, Nigeria",
  },
  {
    name: "Kofi Mensah",
    email: "user11@example.com",
    role: "READER",
    bio: "Afro-fusion is the future",
    location: "Kumasi, Ghana",
  },
  {
    name: "Blessing Eze",
    email: "user12@example.com",
    role: "READER",
    bio: "Gospel music is my therapy",
    location: "Owerri, Nigeria",
  },
  {
    name: "Damilola Ogun",
    email: "user13@example.com",
    role: "READER",
    bio: "Street pop and amapiano vibes",
    location: "Lagos, Nigeria",
  },
  {
    name: "Wanjiku Kamau",
    email: "user14@example.com",
    role: "READER",
    bio: "East African beats connect us all",
    location: "Nairobi, Kenya",
  },
  {
    name: "Obinna Udeh",
    email: "user15@example.com",
    role: "CONTRIBUTOR",
    bio: "Sound engineer and mixer",
    location: "Lagos, Nigeria",
  },
  {
    name: "Fatima Bello",
    email: "user16@example.com",
    role: "READER",
    bio: "Quiet listener, loud opinions",
    location: "Kaduna, Nigeria",
  },
  {
    name: "Segun Olawale",
    email: "user17@example.com",
    role: "READER",
    bio: "Old school naija music never dies",
    location: "Abeokuta, Nigeria",
  },
  {
    name: "Chioma Ndu",
    email: "user18@example.com",
    role: "READER",
    bio: "Discovering indie African artists",
    location: "Benin City, Nigeria",
  },
  {
    name: "Abdul Rashid",
    email: "user19@example.com",
    role: "READER",
    bio: "Reggae and dancehall selector",
    location: "Lagos, Nigeria",
  },
  {
    name: "Nneka Igwe",
    email: "user20@example.com",
    role: "READER",
    bio: "Music teacher and choir director",
    location: "Nsukka, Nigeria",
  },
];

// ── Unsplash Image Pool (portrait-friendly) ──

const STORY_IMAGE_IDS = [
  "1493225457124-a3eb161ffa5f", // concert crowd
  "1511671782779-c97d3d27a1d4", // music performance
  "1514320291840-2e0a9bf2a9ae", // headphones
  "1470225620780-dba8ba36b745", // DJ mixing
  "1459749411175-04bf5292ceea", // guitar player
  "1571266028243-3716f02d3e95", // microphone
  "1493676304819-0d7a8d026dcf", // concert lights
  "1508854710579-5cecc3a9ff17", // turntable vinyl
  "1524368535928-5b5e00ddc76b", // music studio
  "1516280440614-37ccdab37b3c", // singing
  "1504898770365-5b6989e252c4", // African drums
  "1506157786151-b8491531f063", // sunset silhouette
  "1507003211169-0a1dd7228f2d", // portrait face
  "1494790108377-be9c29b29330", // woman portrait
  "1500648767791-00dcc994a43e", // man portrait
  "1534528741775-53994a69daeb", // woman smiling
  "1506794778202-cad84cf45f1d", // man casual
  "1438761681033-6461ffad8d80", // woman creative
  "1472099645785-5658abf4ff4e", // man headshot
  "1531746020798-e6953c6e8e04", // woman fashion
  "1517841905240-472988babdf9", // street culture
  "1529156069898-49953e39b3ac", // dance movement
  "1558618666-fcd25c85f82e", // neon lights
  "1501386761578-0a55d8e7a829", // urban night
  "1492684223066-81342ee5ff30", // stage lights
  "1485579149621-3123dd979885", // vinyl records
  "1526478806334-5fd488fcaabc", // speaker
  "1518609878373-06d740f60d8b", // crowd energy
  "1521747116042-5a810fda9664", // acoustic guitar
  "1487180144351-b8472da7d491", // piano keys
];

const AVATAR_IMAGE_IDS = [
  "1507003211169-0a1dd7228f2d",
  "1494790108377-be9c29b29330",
  "1500648767791-00dcc994a43e",
  "1534528741775-53994a69daeb",
  "1506794778202-cad84cf45f1d",
  "1438761681033-6461ffad8d80",
  "1472099645785-5658abf4ff4e",
  "1531746020798-e6953c6e8e04",
  "1580489944761-15a19d654956",
  "1544005313-94ddf0286df2",
  "1527980965255-5332b567b8b6",
  "1543610892-0b1f7e6d8ac1",
  "1560250097-0b93528c311a",
  "1552058544-f2b08422138a",
  "1519345182560-3f2917c472ef",
  "1567532939604-b6b5b0db2604",
  "1573496359142-b8d87734a5a2",
  "1566492031773-4f4e44671857",
  "1504257432389-52343af06ae3",
  "1542206395-9feb3edaa68d",
];

// ── Captions Pool ──

const CAPTIONS = [
  "Vibes on another level tonight 🎵",
  "Studio session cooking up something special",
  "This beat is everything 🔥",
  "New music dropping soon, stay tuned!",
  "Afrobeats to the world 🌍",
  "Late night studio grind",
  "The energy at this show was unreal",
  "Music is the universal language",
  "Blessed to do what I love ❤️",
  "When the bass hits different",
  "Headphones on, world off 🎧",
  "Creating magic in the booth",
  "This melody won't leave my head",
  "Concert vibes are unmatched",
  "New playlist alert 🚨",
  "Sound check complete, ready to go",
  "The crowd was amazing tonight",
  "Vinyl collection growing 📀",
  "Songwriting at golden hour",
  "The rhythm of Lagos never stops",
];

// ── Text Story Content ──

const TEXT_STORIES = [
  {
    text: "Music is not what I do, it's who I am 🎶",
    bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    text: "Every song has a story. What's yours?",
    bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    text: "Afrobeats is taking over the world and I'm here for it 🌍",
    bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    text: "Drop your favourite song in my DMs 🎵",
    bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    text: "The best concerts are the ones where you lose your voice",
    bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  },
  {
    text: "New week, new playlist. Let's go! 🔥",
    bg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  },
  {
    text: "Support your local artists. Stream their music today.",
    bg: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  },
  {
    text: "Friday night and the vibes are immaculate ✨",
    bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  },
  {
    text: "That feeling when the beat drops and the whole room moves 🕺",
    bg: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  },
  { text: "Music heals. Pass it on. 💜", bg: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)" },
];

// ── Helpers ──

async function checkImageAvailability(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch {
    return null;
  }
}

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return getMediaUrl(key);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Main ──

async function main() {
  console.log("🚀 Starting seed: 20 users + 100 stories\n");

  // 1. Verify Unsplash image availability
  console.log("📸 Verifying Unsplash image availability...");
  const verifiedStoryImages: string[] = [];
  const verifiedAvatarImages: string[] = [];

  for (const id of STORY_IMAGE_IDS) {
    const url = `https://images.unsplash.com/photo-${id}?w=1080&h=1920&fit=crop&q=80`;
    const ok = await checkImageAvailability(url);
    if (ok) {
      verifiedStoryImages.push(id);
      process.stdout.write(".");
    } else {
      process.stdout.write("x");
    }
  }
  console.log(
    `\n   ${verifiedStoryImages.length}/${STORY_IMAGE_IDS.length} story images available`
  );

  for (const id of AVATAR_IMAGE_IDS) {
    const url = `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&crop=face&q=80`;
    const ok = await checkImageAvailability(url);
    if (ok) {
      verifiedAvatarImages.push(id);
      process.stdout.write(".");
    } else {
      process.stdout.write("x");
    }
  }
  console.log(
    `\n   ${verifiedAvatarImages.length}/${AVATAR_IMAGE_IDS.length} avatar images available\n`
  );

  if (verifiedStoryImages.length < 10) {
    console.error("Not enough verified story images. Need at least 10.");
    process.exit(1);
  }
  if (verifiedAvatarImages.length < 5) {
    console.error("Not enough verified avatar images. Need at least 5.");
    process.exit(1);
  }

  // 2. Hash password once
  const hashedPassword = await hash(PASSWORD, 12);

  // 3. Create users + upload avatars + create stories
  const expiresAt = new Date(Date.now() + STORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  for (let u = 0; u < USERS.length; u++) {
    const userData = USERS[u];
    console.log(`👤 [${u + 1}/20] Creating user: ${userData.name}`);

    // Upsert user (safe for re-runs)
    let user = await db.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name, bio: userData.bio, location: userData.location },
      create: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role as "READER" | "CONTRIBUTOR",
        bio: userData.bio,
        location: userData.location,
      },
    });

    // Upload avatar if user doesn't have one
    if (!user.image && verifiedAvatarImages.length > 0) {
      const avatarId = verifiedAvatarImages[u % verifiedAvatarImages.length];
      const avatarUrl = `https://images.unsplash.com/photo-${avatarId}?w=200&h=200&fit=crop&crop=face&q=80`;
      const avatarBuf = await downloadImage(avatarUrl);

      if (avatarBuf) {
        const avatarKey = `avatars/${user.id}/${randomUUID()}.jpg`;
        const cdnUrl = await uploadToR2(avatarBuf, avatarKey, "image/jpeg");
        user = await db.user.update({
          where: { id: user.id },
          data: { image: cdnUrl },
        });
        console.log(`   Avatar uploaded`);
      }
    }

    // Create 5 stories for this user
    for (let s = 0; s < 5; s++) {
      const isTextStory = s === 4; // Last story is always a text story
      const itemCount = isTextStory ? 1 : randInt(1, 3);
      const items: Array<{
        type: "IMAGE" | "TEXT";
        mediaUrl: string;
        caption: string | null;
        duration: number;
        order: number;
        backgroundColor: string | null;
        textContent: string | null;
      }> = [];

      for (let i = 0; i < itemCount; i++) {
        if (isTextStory) {
          // Text story — use gradient background, still need a mediaUrl
          const textPreset = pick(TEXT_STORIES);
          // For text stories, use a simple solid color image as mediaUrl placeholder
          const imgId = pick(verifiedStoryImages);
          const imgUrl = `https://images.unsplash.com/photo-${imgId}?w=1080&h=1920&fit=crop&q=80`;
          const imgBuf = await downloadImage(imgUrl);

          let mediaUrl = "";
          if (imgBuf) {
            const key = `stories/${user.id}/${randomUUID()}.jpg`;
            mediaUrl = await uploadToR2(imgBuf, key, "image/jpeg");
          }

          items.push({
            type: "TEXT",
            mediaUrl,
            caption: null,
            duration: randInt(5, 8),
            order: i,
            backgroundColor: textPreset.bg,
            textContent: textPreset.text,
          });
        } else {
          // Image story
          const imgId = pick(verifiedStoryImages);
          const imgUrl = `https://images.unsplash.com/photo-${imgId}?w=1080&h=1920&fit=crop&q=80`;
          const imgBuf = await downloadImage(imgUrl);

          if (!imgBuf) continue;

          const key = `stories/${user.id}/${randomUUID()}.jpg`;
          const mediaUrl = await uploadToR2(imgBuf, key, "image/jpeg");

          items.push({
            type: "IMAGE",
            mediaUrl,
            caption: pick(CAPTIONS),
            duration: randInt(5, 10),
            order: i,
            backgroundColor: null,
            textContent: null,
          });
        }
      }

      if (items.length === 0) continue;

      await db.story.create({
        data: {
          authorId: user.id,
          expiresAt,
          items: {
            create: items,
          },
        },
      });

      console.log(
        `   Story ${s + 1}/5 created (${items.length} item${items.length > 1 ? "s" : ""})`
      );
    }

    console.log("");
  }

  console.log("✅ Seed complete!");
  console.log(`   20 users created`);
  console.log(`   100 stories created`);
  console.log(`   Stories expire: ${expiresAt.toISOString()}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
