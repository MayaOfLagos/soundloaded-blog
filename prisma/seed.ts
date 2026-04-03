import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const db = new PrismaClient();

// ── Validated image sources (all curl-tested 200) ─────────────────────
// Cover images (800x450 landscape)
const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1504509546545-e000b4a62425?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1571974599782-87624638275e?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1508854710579-5cecc3a9ff17?w=800&h=450&fit=crop",
];

// Square images for artist photos & album covers (400x400)
const SQUARE_IMAGES = [
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1446057032654-9d8885db76c6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1484755560615-a4c64e778a6c?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&h=400&fit=crop",
];

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "seed");

// ── Download image and save locally ───────────────────────────────────
async function downloadImage(url: string, filename: string): Promise<string | null> {
  const filePath = path.join(UPLOAD_DIR, filename);
  const publicPath = `/uploads/seed/${filename}`;

  // Skip if already downloaded
  if (existsSync(filePath)) {
    return publicPath;
  }

  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      console.warn(`  ⚠ Failed to download ${url}: ${res.status}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(filePath, buffer);
    console.log(`  ✓ Downloaded ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return publicPath;
  } catch (err) {
    console.warn(`  ⚠ Error downloading ${url}:`, err);
    return null;
  }
}

// ── Download all images ───────────────────────────────────────────────
async function downloadAllImages() {
  console.log("\n📸 Downloading seed images...\n");
  await mkdir(UPLOAD_DIR, { recursive: true });

  const covers: string[] = [];
  const squares: string[] = [];

  for (let i = 0; i < COVER_IMAGES.length; i++) {
    const result = await downloadImage(COVER_IMAGES[i], `cover-${i + 1}.jpg`);
    if (result) covers.push(result);
  }

  for (let i = 0; i < SQUARE_IMAGES.length; i++) {
    const result = await downloadImage(SQUARE_IMAGES[i], `square-${i + 1}.jpg`);
    if (result) squares.push(result);
  }

  if (covers.length === 0 || squares.length === 0) {
    throw new Error("Failed to download enough images. Check your internet connection.");
  }

  return { covers, squares };
}

function pickCover(covers: string[], index: number) {
  return covers[index % covers.length];
}

function pickSquare(squares: string[], index: number) {
  return squares[index % squares.length];
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function randomViews() {
  return Math.floor(Math.random() * 50000) + 200;
}

function randomDownloads() {
  return Math.floor(Math.random() * 25000) + 100;
}

function randomStreams() {
  return Math.floor(Math.random() * 80000) + 500;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function makeBody(paragraphs: string[]) {
  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p }],
    })),
  };
}

// ── Seed data ────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    name: "Music",
    slug: "music",
    description: "Latest music releases, downloads and reviews",
    color: "#8B5CF6",
  },
  {
    name: "News",
    slug: "news",
    description: "Nigerian entertainment and music industry news",
    color: "#0EA5E9",
  },
  {
    name: "Gist",
    slug: "gist",
    description: "Celebrity gossip, drama and trending stories",
    color: "#F59E0B",
  },
  {
    name: "Albums",
    slug: "albums",
    description: "Album and EP reviews, tracklists and ratings",
    color: "#EC4899",
  },
  {
    name: "Videos",
    slug: "videos",
    description: "Music videos, vlogs and visual content",
    color: "#EF4444",
  },
  { name: "Lyrics", slug: "lyrics", description: "Song lyrics and breakdowns", color: "#10B981" },
];

const TAGS = [
  "Afrobeats",
  "Amapiano",
  "Gospel",
  "Hip Hop",
  "R&B",
  "Fuji",
  "Highlife",
  "New Release",
  "Freestyle",
  "Mixtape",
  "Trending",
  "Exclusive",
  "EP",
  "Album",
  "Single",
  "Music Video",
  "Behind The Scenes",
  "Interview",
  "Award",
  "Concert",
  "Festival",
  "Naija",
  "Afropop",
  "Drill",
  "Alté",
];

const ARTISTS_DATA = [
  {
    name: "Wizkid",
    slug: "wizkid",
    genre: "Afrobeats",
    bio: "Ayodeji Ibrahim Balogun, known as Wizkid, is a Grammy-winning Nigerian singer and songwriter. He rose to fame with 'Holla at Your Boy' and has since become one of Africa's biggest music exports.",
    instagram: "wizkidayo",
    twitter: "wiaboriii",
  },
  {
    name: "Burna Boy",
    slug: "burna-boy",
    genre: "Afro-fusion",
    bio: "Damini Ebunoluwa Ogulu, known as Burna Boy, is a Grammy-winning Nigerian singer, songwriter and rapper. His unique blend of Afrobeats, dancehall and reggae has earned him global recognition.",
    instagram: "burnaboygram",
    twitter: "buraborii",
  },
  {
    name: "Davido",
    slug: "davido",
    genre: "Afrobeats",
    bio: "David Adedeji Adeleke, known as Davido or OBO, is a Nigerian singer, songwriter and record producer. He is one of the most influential artists in African music.",
    instagram: "davido",
    twitter: "davaborii",
  },
  {
    name: "Asake",
    slug: "asake",
    genre: "Amapiano",
    bio: "Ahmed Ololade, known as Asake or Mr Money, is a Nigerian singer and songwriter known for his unique blend of Amapiano, Fuji and street pop.",
    instagram: "asaborni",
    twitter: "asaborni",
  },
  {
    name: "Rema",
    slug: "rema",
    genre: "Afrorave",
    bio: "Divine Ikubor, known as Rema, is a Nigerian singer and songwriter. His hit single 'Calm Down' became one of the biggest Afrobeats songs globally.",
    instagram: "heisrema",
    twitter: "heisrema",
  },
  {
    name: "Tems",
    slug: "tems",
    genre: "Alté R&B",
    bio: "Temilade Openiyi, known as Tems, is a Grammy-winning Nigerian singer and songwriter known for her soulful voice and genre-blending sound.",
    instagram: "temsbaby",
    twitter: "temsbaby",
  },
  {
    name: "Ayra Starr",
    slug: "ayra-starr",
    genre: "Afropop",
    bio: "Oyinkansola Sarah Aderibigbe, known as Ayra Starr, is a Nigerian singer signed to Mavin Records. Her debut album '19 & Dangerous' was critically acclaimed.",
    instagram: "ayrastarr",
    twitter: "ayrastarr",
  },
  {
    name: "Fireboy DML",
    slug: "fireboy-dml",
    genre: "Afropop",
    bio: "Adedamola Adefolahan, known as Fireboy DML, is a Nigerian singer and songwriter signed to YBNL Nation. Known for his melodic style and love-themed music.",
    instagram: "fireboydml",
    twitter: "firaborii",
  },
  {
    name: "Olamide",
    slug: "olamide",
    genre: "Hip Hop",
    bio: "Olamide Gbenga Adedeji, known as Olamide or Baddo, is a Nigerian rapper and the founder of YBNL Nation. One of the most influential rappers in Nigerian music.",
    instagram: "olamide",
    twitter: "olamide",
  },
  {
    name: "Omah Lay",
    slug: "omah-lay",
    genre: "Afro-fusion",
    bio: "Stanley Omah Didia, known as Omah Lay, is a Nigerian singer and songwriter known for his unique vocal style and introspective lyrics.",
    instagram: "omahlay",
    twitter: "omahlaborii",
  },
  {
    name: "CKay",
    slug: "ckay",
    genre: "Afropop",
    bio: "Chukwuka Ekweani, known as CKay, is a Nigerian singer and producer. His song 'Love Nwantiti' became a global viral hit on TikTok.",
    instagram: "ckay_yo",
    twitter: "ckay_yo",
  },
  {
    name: "Ruger",
    slug: "ruger",
    genre: "Afrobeats",
    bio: "Michael Adebayo Olayinka, known as Ruger, is a Nigerian singer signed to Jonzing World. Known for his distinctive eye patch and catchy melodies.",
    instagram: "ruaborii",
    twitter: "ruaborii",
  },
  {
    name: "BNXN",
    slug: "bnxn",
    genre: "Afro-fusion",
    bio: "Daniel Benson, known as BNXN (formerly Buju), is a Nigerian singer and songwriter known for his smooth vocals and versatile style.",
    instagram: "bnxn",
    twitter: "bnxn",
  },
  {
    name: "Seyi Vibez",
    slug: "seyi-vibez",
    genre: "Street Pop",
    bio: "Balogun Afolabi Oluwaloseyi, known as Seyi Vibez, is a Nigerian singer and songwriter from Lagos known for his unique street pop and motivational lyrics.",
    instagram: "seyivibez",
    twitter: "seyivibez",
  },
  {
    name: "Kizz Daniel",
    slug: "kizz-daniel",
    genre: "Afropop",
    bio: "Oluwatobiloba Daniel Anidugbe, known as Kizz Daniel, is a Nigerian singer and songwriter. His hit 'Buga' became an anthem across Africa.",
    instagram: "kaboriii",
    twitter: "kaboriii",
  },
  {
    name: "Tiwa Savage",
    slug: "tiwa-savage",
    genre: "Afrobeats",
    bio: "Tiwatope Savage, known as Tiwa Savage, is a Nigerian singer, songwriter and actress. She is one of the biggest female artists in African music.",
    instagram: "tiwasavage",
    twitter: "tiwasavage",
  },
  {
    name: "Zinoleesky",
    slug: "zinoleesky",
    genre: "Street Pop",
    bio: "Oniyide Azeez, known as Zinoleesky, is a Nigerian singer and songwriter from Agege, Lagos. Known for his melodic street pop sound.",
    instagram: "zinoleesky",
    twitter: "zinoleesky",
  },
  {
    name: "Portable",
    slug: "portable",
    genre: "Street Hop",
    bio: "Habeeb Okikiola, known as Portable or Zazoo Zeh, is a Nigerian street-hop artist known for his energetic performances and viral moments.",
    instagram: "portablebaeby",
    twitter: "portablebaeby",
  },
  {
    name: "Shallipopi",
    slug: "shallipopi",
    genre: "Afrobeats",
    bio: "Crown Uzama, known as Shallipopi, is a Nigerian singer from Benin City. His breakout hit 'Elon Musk' took the Nigerian music scene by storm.",
    instagram: "shallipopi",
    twitter: "shallipopi",
  },
  {
    name: "Victony",
    slug: "victony",
    genre: "Alté",
    bio: "Victor Anthony, known as Victony, is a Nigerian singer and songwriter known for his smooth vocals and genre-blending artistry.",
    instagram: "victony",
    twitter: "victony",
  },
];

const ALBUMS_DATA = [
  {
    title: "Morayo",
    artist: "wizkid",
    type: "ALBUM" as const,
    genre: "Afrobeats",
    label: "Starboy Entertainment",
    year: 2025,
  },
  {
    title: "I Told Them",
    artist: "burna-boy",
    type: "ALBUM" as const,
    genre: "Afro-fusion",
    label: "Spaceship Records",
    year: 2025,
  },
  {
    title: "Timeless",
    artist: "davido",
    type: "ALBUM" as const,
    genre: "Afrobeats",
    label: "DMW Records",
    year: 2025,
  },
  {
    title: "Lungu Boy",
    artist: "asake",
    type: "ALBUM" as const,
    genre: "Amapiano",
    label: "YBNL / Empire",
    year: 2025,
  },
  {
    title: "HEIS",
    artist: "rema",
    type: "ALBUM" as const,
    genre: "Afrorave",
    label: "Mavin / Jonzing",
    year: 2025,
  },
  {
    title: "Born in the Wild",
    artist: "tems",
    type: "ALBUM" as const,
    genre: "Alté R&B",
    label: "Since '95 Records",
    year: 2025,
  },
  {
    title: "The Year I Turned 21",
    artist: "ayra-starr",
    type: "ALBUM" as const,
    genre: "Afropop",
    label: "Mavin Records",
    year: 2025,
  },
  {
    title: "Adedamola",
    artist: "fireboy-dml",
    type: "ALBUM" as const,
    genre: "Afropop",
    label: "YBNL Nation",
    year: 2025,
  },
  {
    title: "Luth",
    artist: "seyi-vibez",
    type: "EP" as const,
    genre: "Street Pop",
    label: "Seyi Vibez Music",
    year: 2025,
  },
  {
    title: "Buga Deluxe",
    artist: "kizz-daniel",
    type: "EP" as const,
    genre: "Afropop",
    label: "Fly Boy Inc",
    year: 2025,
  },
];

// ── Music tracks ──────────────────────────────────────────────────────
const MUSIC_TRACKS = [
  {
    title: "Piece of My Heart",
    artist: "wizkid",
    album: "morayo",
    genre: "Afrobeats",
    duration: 215,
    year: 2025,
  },
  {
    title: "Gbese",
    artist: "wizkid",
    album: "morayo",
    genre: "Afrobeats",
    duration: 198,
    year: 2025,
  },
  {
    title: "Lagos Love Story",
    artist: "wizkid",
    album: null,
    genre: "Afrobeats",
    duration: 230,
    year: 2026,
  },
  {
    title: "City Boy Anthem",
    artist: "burna-boy",
    album: "i-told-them",
    genre: "Afro-fusion",
    duration: 245,
    year: 2025,
  },
  {
    title: "Dangote Flow",
    artist: "burna-boy",
    album: null,
    genre: "Afro-fusion",
    duration: 202,
    year: 2026,
  },
  {
    title: "Away (Remix)",
    artist: "davido",
    album: "timeless",
    genre: "Afrobeats",
    duration: 220,
    year: 2025,
  },
  {
    title: "Unavailable Forever",
    artist: "davido",
    album: null,
    genre: "Afrobeats",
    duration: 195,
    year: 2026,
  },
  {
    title: "Yoga (Remix)",
    artist: "asake",
    album: "lungu-boy",
    genre: "Amapiano",
    duration: 210,
    year: 2025,
  },
  {
    title: "2:30 (Deluxe)",
    artist: "asake",
    album: "lungu-boy",
    genre: "Amapiano",
    duration: 188,
    year: 2025,
  },
  {
    title: "MrMoney Vibes",
    artist: "asake",
    album: null,
    genre: "Amapiano",
    duration: 176,
    year: 2026,
  },
  {
    title: "Calm Down (Afrorave Mix)",
    artist: "rema",
    album: "heis",
    genre: "Afrorave",
    duration: 240,
    year: 2025,
  },
  { title: "Benin Boy", artist: "rema", album: null, genre: "Afrorave", duration: 205, year: 2026 },
  {
    title: "Free Mind",
    artist: "tems",
    album: "born-in-the-wild",
    genre: "Alté R&B",
    duration: 250,
    year: 2025,
  },
  {
    title: "Higher Ground",
    artist: "tems",
    album: null,
    genre: "Alté R&B",
    duration: 222,
    year: 2026,
  },
  {
    title: "Rush (Sped Up)",
    artist: "ayra-starr",
    album: "the-year-i-turned-21",
    genre: "Afropop",
    duration: 180,
    year: 2025,
  },
  {
    title: "Bloody Samaritan 2.0",
    artist: "ayra-starr",
    album: null,
    genre: "Afropop",
    duration: 198,
    year: 2026,
  },
  {
    title: "Bandana (Remix)",
    artist: "fireboy-dml",
    album: "adedamola",
    genre: "Afropop",
    duration: 225,
    year: 2025,
  },
  {
    title: "Peru Reloaded",
    artist: "fireboy-dml",
    album: null,
    genre: "Afropop",
    duration: 200,
    year: 2026,
  },
  {
    title: "Eni Duro",
    artist: "olamide",
    album: null,
    genre: "Hip Hop",
    duration: 192,
    year: 2026,
  },
  {
    title: "Baddo Legacy",
    artist: "olamide",
    album: null,
    genre: "Hip Hop",
    duration: 210,
    year: 2025,
  },
  {
    title: "Soso (Acoustic)",
    artist: "omah-lay",
    album: null,
    genre: "Afro-fusion",
    duration: 235,
    year: 2025,
  },
  {
    title: "Godly 2.0",
    artist: "omah-lay",
    album: null,
    genre: "Afro-fusion",
    duration: 200,
    year: 2026,
  },
  {
    title: "Love Nwantiti (2026 Remix)",
    artist: "ckay",
    album: null,
    genre: "Afropop",
    duration: 218,
    year: 2026,
  },
  {
    title: "Dior (Deluxe)",
    artist: "ruger",
    album: null,
    genre: "Afrobeats",
    duration: 190,
    year: 2025,
  },
  {
    title: "Asiwaju Refix",
    artist: "ruger",
    album: null,
    genre: "Afrobeats",
    duration: 185,
    year: 2026,
  },
  {
    title: "All I Want",
    artist: "bnxn",
    album: null,
    genre: "Afro-fusion",
    duration: 228,
    year: 2026,
  },
  {
    title: "Lenu Remix",
    artist: "bnxn",
    album: null,
    genre: "Afro-fusion",
    duration: 195,
    year: 2025,
  },
  {
    title: "Billion Dollar",
    artist: "seyi-vibez",
    album: "luth",
    genre: "Street Pop",
    duration: 178,
    year: 2025,
  },
  {
    title: "Catalyst",
    artist: "seyi-vibez",
    album: null,
    genre: "Street Pop",
    duration: 202,
    year: 2026,
  },
  {
    title: "Buga (Afrohouse Mix)",
    artist: "kizz-daniel",
    album: "buga-deluxe",
    genre: "Afropop",
    duration: 215,
    year: 2025,
  },
  {
    title: "Cough (Odo)",
    artist: "kizz-daniel",
    album: null,
    genre: "Afropop",
    duration: 193,
    year: 2026,
  },
  {
    title: "Somebody's Son Pt. 2",
    artist: "tiwa-savage",
    album: null,
    genre: "Afrobeats",
    duration: 242,
    year: 2025,
  },
  {
    title: "Koroba Refix",
    artist: "tiwa-savage",
    album: null,
    genre: "Afrobeats",
    duration: 188,
    year: 2026,
  },
  {
    title: "Mapariwo",
    artist: "zinoleesky",
    album: null,
    genre: "Street Pop",
    duration: 170,
    year: 2026,
  },
  {
    title: "Kilofeshe Remix",
    artist: "zinoleesky",
    album: null,
    genre: "Street Pop",
    duration: 195,
    year: 2025,
  },
  {
    title: "Zazoo Zeh 2.0",
    artist: "portable",
    album: null,
    genre: "Street Hop",
    duration: 165,
    year: 2025,
  },
  {
    title: "Elon Musk (Global Remix)",
    artist: "shallipopi",
    album: null,
    genre: "Afrobeats",
    duration: 200,
    year: 2026,
  },
  {
    title: "Mansion Guard",
    artist: "shallipopi",
    album: null,
    genre: "Afrobeats",
    duration: 185,
    year: 2025,
  },
  {
    title: "Soweto Remix",
    artist: "victony",
    album: null,
    genre: "Alté",
    duration: 220,
    year: 2025,
  },
  { title: "Kolomental", artist: "victony", album: null, genre: "Alté", duration: 198, year: 2026 },
];

// ── News posts ────────────────────────────────────────────────────────
const NEWS_POSTS = [
  {
    title: "Wizkid Announces Sold-Out Stadium Tour Across Africa",
    excerpt:
      "The Grammy-winning Afrobeats star confirms dates for his biggest African tour yet, with shows in Lagos, Accra, Nairobi and Johannesburg.",
    body: [
      "Wizkid has officially announced his highly anticipated stadium tour across Africa, marking the biggest concert series by a Nigerian artist on the continent.",
      "The tour, dubbed 'Morayo World Tour', will kick off in Lagos at the Teslim Balogun Stadium before moving to Accra's Independence Square, Nairobi's Kasarani Stadium, and Johannesburg's FNB Stadium.",
      "Tickets sold out within hours of going on sale, with fans across the continent showing massive support for the Afrobeats pioneer. VIP packages reportedly cost up to ₦5 million.",
      "This tour follows the massive success of his latest album 'Morayo', which debuted at number one on the Billboard World Albums chart.",
    ],
    tags: ["Afrobeats", "Concert", "Trending"],
  },
  {
    title: "Burna Boy Wins Best International Act at BET Awards 2026",
    excerpt:
      "The African Giant adds another international accolade to his growing collection of awards.",
    body: [
      "Burna Boy has once again proven why he is called the African Giant, winning the Best International Act at the 2026 BET Awards held in Los Angeles.",
      "This marks his fourth consecutive win in the category, cementing his status as Africa's most decorated artist on the international stage.",
      "In his acceptance speech, Burna Boy dedicated the award to the youth of Nigeria, saying 'This is for every young person in Naija hustling to make their dreams come true.'",
      "The win comes after a stellar year that saw his album 'I Told Them' go platinum in multiple countries.",
    ],
    tags: ["Afrobeats", "Award", "Trending"],
  },
  {
    title: "Davido and Chioma Celebrate First Wedding Anniversary in Style",
    excerpt:
      "The music power couple threw a star-studded celebration that had all of Lagos talking.",
    body: [
      "Davido and Chioma Adeleke celebrated their first wedding anniversary with a lavish party at their Banana Island mansion in Lagos.",
      "The event, which was attended by top celebrities including Olamide, Tiwa Savage, and Don Jazzy, featured performances from several A-list artists.",
      "Davido took to social media to share heartfelt messages about his wife, saying 'One year with the love of my life. Chioma, you make everything worth it.'",
      "The couple's love story has been one of the most followed celebrity relationships in Nigerian entertainment history.",
    ],
    tags: ["Trending", "Naija"],
  },
  {
    title: "Nigeria's Music Industry Revenue Hits $1 Billion Milestone",
    excerpt:
      "PwC report reveals that Nigeria's music industry has crossed the billion-dollar mark for the first time in history.",
    body: [
      "A new report by PricewaterhouseCoopers has revealed that Nigeria's music industry generated over $1 billion in revenue in 2025, marking a historic milestone.",
      "The growth was driven primarily by streaming platforms, live performances, and brand endorsements, with Afrobeats continuing to dominate global playlists.",
      "Nigeria now accounts for over 60% of Africa's total music industry revenue, with artists like Wizkid, Burna Boy, and Davido leading the charge.",
      "Industry experts predict that the revenue could double by 2030 as more African artists break into the global market.",
    ],
    tags: ["Naija", "Trending", "Interview"],
  },
  {
    title: "Asake Breaks Spotify Record for Most-Streamed Amapiano Song",
    excerpt:
      "Mr Money's latest single shatters streaming records on Spotify, becoming the most-streamed Amapiano track of all time.",
    body: [
      "Asake has broken another record, this time on Spotify where his latest single has become the most-streamed Amapiano track in the platform's history.",
      "The song accumulated over 500 million streams in just three months, surpassing previous records held by South African Amapiano artists.",
      "Asake's unique blend of Amapiano with Fuji and street-pop elements has created a new subgenre that resonates with listeners across Africa and beyond.",
      "Spotify's Head of Music for Africa praised the achievement, calling it 'a testament to the global appeal of Nigerian music.'",
    ],
    tags: ["Amapiano", "Trending", "New Release"],
  },
  {
    title: "Headies Awards 2026: Full List of Nominees Announced",
    excerpt:
      "The organizers of Nigeria's biggest music awards ceremony have released the complete nomination list for 2026.",
    body: [
      "The Headies Awards has announced its full list of nominees for the 2026 ceremony, with Asake and Rema leading the pack with 8 nominations each.",
      "Burna Boy, Wizkid, and Davido also received multiple nominations across various categories including Artiste of the Year and Album of the Year.",
      "New categories this year include Best Amapiano Act and Best Music Video Director, reflecting the evolving landscape of Nigerian music.",
      "The ceremony will be held at the Eko Convention Centre in Lagos, with performances from some of the biggest names in African music.",
    ],
    tags: ["Award", "Naija", "Trending"],
  },
];

// ── Gist posts ────────────────────────────────────────────────────────
const GIST_POSTS = [
  {
    title: "Portable Causes Stir at Lagos Fashion Week With Wild Outfit",
    excerpt:
      "The controversial street-hop artist showed up wearing an outfit made entirely of dollar bills, sparking reactions across social media.",
    body: [
      "Portable, the controversial Nigerian street-hop artist, caused a major scene at Lagos Fashion Week when he arrived wearing an outfit reportedly made from real dollar bills.",
      "The outfit, which Portable claimed cost over ₦10 million, immediately went viral on social media with Nigerians divided between calling it creative and wasteful.",
      "Event organizers initially tried to deny him entry, but the growing crowd of fans outside forced them to let the Zazoo Zeh crooner in.",
      "Portable later took to Instagram to defend his outfit, saying 'I am fashion. Fashion is me. Zazoo no dey disappoint.'",
    ],
    tags: ["Trending", "Naija"],
  },
  {
    title: "Rema Spotted House Hunting in Beverly Hills Ahead of US Move",
    excerpt:
      "The Calm Down hitmaker is reportedly looking at luxury properties in Los Angeles as he plans to split time between Nigeria and the US.",
    body: [
      "Nigerian superstar Rema has been spotted house hunting in the prestigious Beverly Hills neighborhood of Los Angeles, according to multiple reports.",
      "Real estate sources reveal the singer has been viewing properties in the $5-10 million range, suggesting a serious move towards establishing a US base.",
      "The move comes as Rema continues to expand his global brand, with collaborations with international artists and performances at major US festivals.",
      "Fans have been supportive of the move, though some worry it could affect his connection to the Nigerian music scene that made him famous.",
    ],
    tags: ["Trending", "Naija"],
  },
  {
    title: "Don Jazzy Finally Reveals Mystery Girlfriend on Valentine's Day",
    excerpt:
      "The Mavin Records boss broke the internet when he posted a photo with his new partner for the first time.",
    body: [
      "Don Jazzy, the legendary Nigerian music producer and Mavin Records boss, shocked fans when he revealed his mystery girlfriend on Valentine's Day.",
      "The photo, posted on his Instagram, showed Don Jazzy with a beautiful woman whose identity has been kept private, with the caption 'My person ❤️'.",
      "The post received over 2 million likes within hours, becoming one of the most liked celebrity posts in Nigerian Instagram history.",
      "Fans and celebrities flooded the comments with congratulations, with many joking that they had been worried the mogul would never settle down.",
    ],
    tags: ["Trending", "Naija"],
  },
  {
    title: "Shallipopi Buys ₦200 Million Mansion in Benin City for His Mother",
    excerpt:
      "The Elon Musk hitmaker surprised his mother with a luxury mansion, sharing emotional videos on social media.",
    body: [
      "Nigerian singer Shallipopi has surprised his mother with a ₦200 million mansion in Benin City, Edo State, sharing tearful videos of the moment on social media.",
      "The luxury property features five bedrooms, a swimming pool, a home cinema, and a spacious garden, all furnished to the highest standards.",
      "Shallipopi, whose real name is Crown Uzama, shared that buying a house for his mother had been his biggest dream since breaking into the music industry.",
      "The gesture has earned him widespread praise from fans and fellow artists, with many calling him a role model for young Nigerian musicians.",
    ],
    tags: ["Trending", "Naija"],
  },
];

// ── Video posts ───────────────────────────────────────────────────────
const VIDEO_POSTS = [
  {
    title: "Burna Boy 'City Boy Anthem' Official Music Video",
    excerpt:
      "Burna Boy delivers stunning visuals for his hit single, shot across Lagos and London with a star-studded cameo lineup.",
    body: [
      "Burna Boy has released the official music video for 'City Boy Anthem', the lead single from his latest project.",
      "Directed by renowned video director TG Omori, the video was shot across multiple locations in Lagos and London, showcasing both cities' vibrant nightlife scenes.",
      "The video features cameo appearances from Stormzy, Skepta, and several Nigerian celebrities, blending the London-Lagos cultural connection that Burna Boy often celebrates.",
      "With over 10 million views in the first 48 hours on YouTube, the video has already become one of the most watched Nigerian music videos of 2026.",
    ],
    tags: ["Music Video", "Afrobeats", "Trending"],
  },
  {
    title: "Asake 'MrMoney Vibes' Official Music Video Breaks YouTube Record",
    excerpt:
      "The colorful visual shot in Lekki and Ikoyi becomes the fastest Nigerian music video to hit 50 million views.",
    body: [
      "Asake's music video for 'MrMoney Vibes' has broken YouTube records, becoming the fastest Nigerian music video to reach 50 million views.",
      "The vibrant video, directed by Dammy Twitch, features elaborate dance sequences shot at iconic Lagos locations including the Lekki-Ikoyi Link Bridge.",
      "The video showcases Asake's signature street-pop aesthetic with high-budget production values, featuring over 100 dancers and custom-designed costumes.",
      "YouTube's trending page had the video at number one globally for three consecutive days, a first for any Nigerian artist.",
    ],
    tags: ["Music Video", "Amapiano", "Trending"],
  },
  {
    title: "Tems 'Higher Ground' Behind The Scenes Documentary",
    excerpt:
      "An exclusive look at the making of Tems' critically acclaimed music video, filmed entirely in the Nigerian countryside.",
    body: [
      "Tems has released a behind-the-scenes documentary for her critically acclaimed 'Higher Ground' music video.",
      "The documentary reveals the extensive creative process behind the video, which was filmed entirely in rural Nigeria to celebrate the country's natural beauty.",
      "Tems personally directed several scenes, working closely with cinematographer Ibra Ake to create the dreamlike visual aesthetic that defines the video.",
      "The 15-minute documentary also features interviews with the local community members who participated in the video, highlighting Tems' commitment to grassroots storytelling.",
    ],
    tags: ["Behind The Scenes", "Alté", "Interview"],
  },
  {
    title: "Davido 'Unavailable Forever' Music Video ft. Lojay",
    excerpt:
      "OBO links up with Lojay for a high-energy visual set in a Lagos nightclub, directed by Director K.",
    body: [
      "Davido has dropped the music video for 'Unavailable Forever' featuring Lojay, and it's everything fans expected and more.",
      "Directed by Director K, the video was shot at the newly opened Club Quilox VIP lounge in Victoria Island, Lagos.",
      "The high-energy visual features stunning lighting effects, choreographed dance sequences, and the signature Davido energy that fans have come to love.",
      "The collaboration between Davido and Lojay has been praised by fans, with many calling it one of the best Nigerian music collaborations of the year.",
    ],
    tags: ["Music Video", "Afrobeats", "New Release"],
  },
];

// ── Album review posts ────────────────────────────────────────────────
const ALBUM_POSTS = [
  {
    title: "Album Review: Wizkid's 'Morayo' — A Masterclass in Afrobeats Evolution",
    excerpt:
      "We review Wizkid's highly anticipated album 'Morayo', a 15-track journey through love, life and Lagos.",
    body: [
      "Wizkid's 'Morayo', named after his mother, is arguably the most mature and refined body of work in his illustrious career.",
      "The 15-track album sees Wizkid explore themes of love, family, success, and the bittersweet reality of fame, all wrapped in lush Afrobeats production.",
      "Standout tracks include 'Piece of My Heart', a soulful ballad with Caribbean influences, and 'Gbese', a high-energy dancefloor anthem produced by P2J.",
      "With features from Tems, Brent Faiyaz, and Angelique Kidjo, 'Morayo' is a truly global album that maintains its Nigerian identity. Rating: 9/10.",
    ],
    tags: ["Album", "Afrobeats", "New Release"],
  },
  {
    title: "EP Review: Seyi Vibez 'Luth' — The Street Pope Delivers Again",
    excerpt:
      "Seyi Vibez drops a 7-track EP that solidifies his position as the king of Nigerian street pop.",
    body: [
      "Seyi Vibez returns with 'Luth', a 7-track EP that further cements his reign as the king of Nigerian street pop.",
      "The EP, named after his Lagos neighborhood, is a deeply personal project that chronicles his journey from the streets to stardom.",
      "Tracks like 'Billion Dollar' showcase his storytelling prowess, while the production — handled by Niphkeys and P.Priime — provides the perfect sonic backdrop.",
      "Seyi Vibez continues to prove that street music can be both commercially successful and artistically meaningful. Rating: 8.5/10.",
    ],
    tags: ["EP", "New Release", "Trending"],
  },
  {
    title: "Album Review: Rema's 'HEIS' — The Afrorave Revolution Continues",
    excerpt: "Rema pushes the boundaries of Afrobeats with his genre-defying sophomore album.",
    body: [
      "Rema's sophomore album 'HEIS' is a bold statement of artistic intent, pushing the boundaries of what Afrobeats can be.",
      "The album blends elements of rave, trap, indie, and traditional Edo music into a cohesive sonic experience that feels both futuristic and deeply rooted.",
      "The production, primarily handled by Andre Vibez and London, is nothing short of spectacular, creating soundscapes that transport listeners to another dimension.",
      "While some fans may miss the more accessible sound of 'Calm Down', 'HEIS' is a creative triumph that cements Rema as one of Africa's most innovative artists. Rating: 8/10.",
    ],
    tags: ["Album", "New Release", "Trending"],
  },
];

// ─── Main seed function ──────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting Soundloaded blog seed...\n");

  // ── 1. Download images ──────────────────────────────────────────────
  const { covers, squares } = await downloadAllImages();

  // ── 2. Clean existing data (order matters for FK) ───────────────────
  console.log("\n🧹 Cleaning existing data...");
  await db.postTag.deleteMany();
  await db.download.deleteMany();
  await db.comment.deleteMany();
  await db.music.deleteMany();
  await db.post.deleteMany();
  await db.album.deleteMany();
  await db.artist.deleteMany();
  await db.tag.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();
  await db.siteSettings.deleteMany();
  console.log("  ✓ Cleaned\n");

  // ── 2b. Create default site settings ────────────────────────────────
  console.log("⚙️  Creating site settings...");
  await db.siteSettings.create({
    data: {
      id: "default",
      siteName: "Soundloaded Blog",
      tagline: "Nigeria's #1 music download & entertainment blog",
      siteUrl: "https://soundloaded.ng",
      contactEmail: "hello@soundloaded.ng",
      copyrightText: "Soundloaded Nigeria. All rights reserved.",
      instagram: "soundloadedng",
      twitter: "soundloadedng",
      facebook: "soundloadedng",
      youtube: "soundloadedng",
      tiktok: "soundloadedng",
    },
  });
  console.log("  ✓ Default site settings created\n");

  // ── 3. Create admin user ────────────────────────────────────────────
  console.log("👤 Creating admin user...");
  const adminUser = await db.user.create({
    data: {
      name: "Soundloaded Admin",
      email: "admin@soundloaded.ng",
      password: await hash("SoundloadedAdmin2026!", 12),
      role: "SUPER_ADMIN",
      image: pickSquare(squares, 0),
    },
  });
  const editorUser = await db.user.create({
    data: {
      name: "Maya",
      email: "maya@soundloaded.ng",
      password: await hash("MayaEditor2026!", 12),
      role: "EDITOR",
      image: pickSquare(squares, 1),
    },
  });
  console.log(`  ✓ Admin: ${adminUser.email}`);
  console.log(`  ✓ Editor: ${editorUser.email}\n`);
  const authors = [adminUser, editorUser];

  // ── 4. Create categories ────────────────────────────────────────────
  console.log("📂 Creating categories...");
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await db.category.create({ data: cat });
    categoryMap[cat.slug] = created.id;
    console.log(`  ✓ ${cat.name}`);
  }
  console.log();

  // ── 5. Create tags ─────────────────────────────────────────────────
  console.log("🏷️  Creating tags...");
  const tagMap: Record<string, string> = {};
  for (const name of TAGS) {
    const slug = generateSlug(name);
    const created = await db.tag.create({ data: { name, slug } });
    tagMap[name] = created.id;
  }
  console.log(`  ✓ ${TAGS.length} tags created\n`);

  // ── 6. Create artists ──────────────────────────────────────────────
  console.log("🎤 Creating artists...");
  const artistMap: Record<string, string> = {};
  for (let i = 0; i < ARTISTS_DATA.length; i++) {
    const a = ARTISTS_DATA[i];
    const created = await db.artist.create({
      data: {
        name: a.name,
        slug: a.slug,
        bio: a.bio,
        photo: pickSquare(squares, i),
        genre: a.genre,
        instagram: a.instagram,
        twitter: a.twitter,
      },
    });
    artistMap[a.slug] = created.id;
    console.log(`  ✓ ${a.name}`);
  }
  console.log();

  // ── 7. Create albums ───────────────────────────────────────────────
  console.log("💿 Creating albums...");
  const albumMap: Record<string, string> = {};
  for (let i = 0; i < ALBUMS_DATA.length; i++) {
    const a = ALBUMS_DATA[i];
    const slug = generateSlug(a.title);
    const created = await db.album.create({
      data: {
        title: a.title,
        slug,
        coverArt: pickSquare(squares, i + 2),
        releaseDate: new Date(`${a.year}-01-15`),
        type: a.type,
        genre: a.genre,
        label: a.label,
        artistId: artistMap[a.artist],
      },
    });
    albumMap[slug] = created.id;
    console.log(`  ✓ ${a.title} (${a.type})`);
  }
  console.log();

  // ── 8. Create music posts + music tracks ───────────────────────────
  console.log("🎵 Creating music tracks & posts...");
  let musicPostCount = 0;
  for (let i = 0; i < MUSIC_TRACKS.length; i++) {
    const t = MUSIC_TRACKS[i];
    const slug = generateSlug(
      `${t.title}-${ARTISTS_DATA.find((a) => a.slug === t.artist)?.name || t.artist}`
    );
    const artistName = ARTISTS_DATA.find((a) => a.slug === t.artist)?.name || t.artist;
    const postTitle = `${artistName} – ${t.title}`;
    const albumSlug = t.album
      ? generateSlug(
          ALBUMS_DATA.find(
            (a) =>
              generateSlug(a.title) === t.album ||
              a.title.toLowerCase().replace(/\s+/g, "-") === t.album
          )?.title || ""
        )
      : null;

    const post = await db.post.create({
      data: {
        title: postTitle,
        slug,
        excerpt: `Download ${artistName} – ${t.title} (${t.genre}). Free mp3 download available on Soundloaded.`,
        body: makeBody([
          `${artistName} drops "${t.title}", a brand new ${t.genre} single${t.album ? ` from the ${t.album.replace(/-/g, " ")} project` : ""}.`,
          `The track runs for ${Math.floor(t.duration / 60)}:${(t.duration % 60).toString().padStart(2, "0")} minutes and showcases ${artistName}'s signature style.`,
          `Download and stream "${t.title}" by ${artistName} below. Don't forget to share with your friends!`,
        ]),
        coverImage: pickCover(covers, i),
        status: "PUBLISHED",
        type: "MUSIC",
        publishedAt: daysAgo(Math.floor(Math.random() * 60)),
        views: randomViews(),
        authorId: authors[i % authors.length].id,
        categoryId: categoryMap["music"],
        tags: {
          create: [
            { tag: { connect: { id: tagMap[t.genre] || tagMap["Afrobeats"] } } },
            { tag: { connect: { id: tagMap["New Release"] } } },
            ...(t.album ? [{ tag: { connect: { id: tagMap["Single"] } } }] : []),
          ],
        },
      },
    });

    await db.music.create({
      data: {
        title: t.title,
        slug: generateSlug(`${t.title}-${t.artist}`),
        r2Key: `music/${t.artist}/${generateSlug(t.title)}.mp3`,
        filename: `${artistName} - ${t.title}.mp3`,
        fileSize: BigInt(Math.floor(Math.random() * 8000000) + 3000000),
        duration: t.duration,
        format: "mp3",
        bitrate: 320,
        coverArt: pickSquare(squares, i % squares.length),
        downloadCount: randomDownloads(),
        streamCount: randomStreams(),
        year: t.year,
        genre: t.genre,
        label: ALBUMS_DATA.find((a) => generateSlug(a.title) === t.album)?.label || null,
        trackNumber: t.album ? (i % 5) + 1 : null,
        postId: post.id,
        artistId: artistMap[t.artist],
        albumId: albumSlug && albumMap[albumSlug] ? albumMap[albumSlug] : null,
      },
    });

    musicPostCount++;
  }
  console.log(`  ✓ ${musicPostCount} music tracks + posts created\n`);

  // ── 9. Create news posts ───────────────────────────────────────────
  console.log("📰 Creating news posts...");
  for (let i = 0; i < NEWS_POSTS.length; i++) {
    const n = NEWS_POSTS[i];
    await db.post.create({
      data: {
        title: n.title,
        slug: generateSlug(n.title),
        excerpt: n.excerpt,
        body: makeBody(n.body),
        coverImage: pickCover(covers, i + 3),
        status: "PUBLISHED",
        type: "NEWS",
        publishedAt: daysAgo(i * 3 + 1),
        views: randomViews(),
        authorId: authors[i % authors.length].id,
        categoryId: categoryMap["news"],
        tags: {
          create: n.tags.map((t) => ({
            tag: { connect: { id: tagMap[t] } },
          })),
        },
      },
    });
    console.log(`  ✓ ${n.title.slice(0, 60)}...`);
  }
  console.log();

  // ── 10. Create gist posts ──────────────────────────────────────────
  console.log("💬 Creating gist posts...");
  for (let i = 0; i < GIST_POSTS.length; i++) {
    const g = GIST_POSTS[i];
    await db.post.create({
      data: {
        title: g.title,
        slug: generateSlug(g.title),
        excerpt: g.excerpt,
        body: makeBody(g.body),
        coverImage: pickCover(covers, i + 7),
        status: "PUBLISHED",
        type: "GIST",
        publishedAt: daysAgo(i * 2 + 1),
        views: randomViews(),
        authorId: authors[i % authors.length].id,
        categoryId: categoryMap["gist"],
        tags: {
          create: g.tags.map((t) => ({
            tag: { connect: { id: tagMap[t] } },
          })),
        },
      },
    });
    console.log(`  ✓ ${g.title.slice(0, 60)}...`);
  }
  console.log();

  // ── 11. Create video posts ─────────────────────────────────────────
  console.log("🎬 Creating video posts...");
  for (let i = 0; i < VIDEO_POSTS.length; i++) {
    const v = VIDEO_POSTS[i];
    await db.post.create({
      data: {
        title: v.title,
        slug: generateSlug(v.title),
        excerpt: v.excerpt,
        body: makeBody(v.body),
        coverImage: pickCover(covers, i + 10),
        status: "PUBLISHED",
        type: "VIDEO",
        publishedAt: daysAgo(i * 4 + 2),
        views: randomViews(),
        authorId: authors[i % authors.length].id,
        categoryId: categoryMap["videos"],
        tags: {
          create: v.tags.map((t) => ({
            tag: { connect: { id: tagMap[t] } },
          })),
        },
      },
    });
    console.log(`  ✓ ${v.title.slice(0, 60)}...`);
  }
  console.log();

  // ── 12. Create album review posts ──────────────────────────────────
  console.log("📀 Creating album review posts...");
  for (let i = 0; i < ALBUM_POSTS.length; i++) {
    const a = ALBUM_POSTS[i];
    await db.post.create({
      data: {
        title: a.title,
        slug: generateSlug(a.title),
        excerpt: a.excerpt,
        body: makeBody(a.body),
        coverImage: pickCover(covers, i + 12),
        status: "PUBLISHED",
        type: "ALBUM",
        publishedAt: daysAgo(i * 5 + 3),
        views: randomViews(),
        authorId: authors[i % authors.length].id,
        categoryId: categoryMap["albums"],
        tags: {
          create: a.tags.map((t) => ({
            tag: { connect: { id: tagMap[t] } },
          })),
        },
      },
    });
    console.log(`  ✓ ${a.title.slice(0, 60)}...`);
  }
  console.log();

  // ── Summary ────────────────────────────────────────────────────────
  const totalPosts = await db.post.count();
  const totalMusic = await db.music.count();
  const totalArtists = await db.artist.count();
  const totalAlbums = await db.album.count();
  const totalCategories = await db.category.count();
  const totalTags = await db.tag.count();

  console.log("═══════════════════════════════════════════════");
  console.log("✅ Seed complete!");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Posts:      ${totalPosts}`);
  console.log(`  Music:      ${totalMusic}`);
  console.log(`  Artists:    ${totalArtists}`);
  console.log(`  Albums:     ${totalAlbums}`);
  console.log(`  Categories: ${totalCategories}`);
  console.log(`  Tags:       ${totalTags}`);
  console.log(`  Users:      2`);
  console.log(`  Settings:   1 (default)`);
  console.log(`  Images:     ${covers.length + squares.length} downloaded`);
  console.log("═══════════════════════════════════════════════\n");
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    db.$disconnect();
    process.exit(1);
  });
