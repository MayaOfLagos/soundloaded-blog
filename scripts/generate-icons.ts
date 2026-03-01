/**
 * Generates PWA icons for all required sizes.
 * Run: pnpm tsx scripts/generate-icons.ts
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const BRAND = "#e11d48";
const OUT_DIR = path.join(process.cwd(), "public/icons");

// SVG icon: brand-coloured square with rounded corners + white "S"
function makeSvg(size: number) {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.58);
  const textY = Math.round(size * 0.72);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND}"/>
  <text
    x="${size / 2}"
    y="${textY}"
    font-family="Arial Black, Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
    text-anchor="middle"
    fill="white"
  >S</text>
</svg>`
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const size of SIZES) {
    await sharp(makeSvg(size))
      .png()
      .toFile(path.join(OUT_DIR, `icon-${size}x${size}.png`));
    console.log(`✓ icon-${size}x${size}.png`);
  }

  // apple-touch-icon (180x180)
  await sharp(makeSvg(180)).png().toFile(path.join(OUT_DIR, "apple-touch-icon.png"));
  console.log("✓ apple-touch-icon.png");

  console.log(`\nAll icons written to public/icons/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
