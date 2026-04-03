import { db } from "@/lib/db";

export async function HeadScripts() {
  const raw = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { headerScripts: true },
  });
  const scripts = raw?.headerScripts;
  if (!scripts) return null;
  return <div dangerouslySetInnerHTML={{ __html: scripts }} />;
}

export async function FooterScripts() {
  const raw = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { footerScripts: true },
  });
  const scripts = raw?.footerScripts;
  if (!scripts) return null;
  return <div dangerouslySetInnerHTML={{ __html: scripts }} />;
}

export async function CustomCss() {
  const raw = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { customCss: true },
  });
  const css = raw?.customCss;
  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function lighten(r: number, g: number, b: number, factor: number): string {
  return `#${[r, g, b]
    .map((c) =>
      Math.min(255, Math.round(c + (255 - c) * factor))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function darken(r: number, g: number, b: number, factor: number): string {
  return `#${[r, g, b]
    .map((c) =>
      Math.round(c * (1 - factor))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export async function BrandColorStyle() {
  const raw = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { brandColor: true },
  });
  const brand = raw?.brandColor;
  if (!brand || !/^#[0-9a-fA-F]{6}$/.test(brand)) return null;

  const [r, g, b] = hexToRgb(brand);
  const lum = luminance(r, g, b);

  // Generate variants
  const brandForeground = lum > 0.5 ? "#0a0a0a" : "#ffffff";
  const brandLight = lighten(r, g, b, 0.35);
  const brandMuted = darken(r, g, b, 0.3);

  const css = `
    :root {
      --brand: ${brand};
      --brand-foreground: ${brandForeground};
      --brand-muted: ${brandLight};
      --primary: ${brand};
      --primary-foreground: ${brandForeground};
    }
    .dark {
      --brand: ${brandLight};
      --brand-foreground: ${lum > 0.5 ? "#ffffff" : "#0a0a0a"};
      --brand-muted: ${brandMuted};
      --primary: ${brandLight};
      --primary-foreground: ${lum > 0.5 ? "#ffffff" : "#0a0a0a"};
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
