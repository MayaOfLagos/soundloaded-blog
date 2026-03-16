import sharp from "sharp";

/**
 * Extract the dominant color from an image URL using sharp.
 * Resizes to 1×1 pixel for a fast average color extraction.
 * Runs server-side at ISR time — no client overhead.
 */
export async function extractDominantColor(
  imageUrl: string
): Promise<{ r: number; g: number; b: number } | null> {
  try {
    const res = await fetch(imageUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const { data } = await sharp(buffer)
      .resize(1, 1, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    return { r: data[0], g: data[1], b: data[2] };
  } catch {
    return null;
  }
}
