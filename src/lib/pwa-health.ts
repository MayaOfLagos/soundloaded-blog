import fs from "node:fs/promises";
import path from "node:path";

type HealthStatus = "ok" | "warning" | "critical";

interface ManifestAsset {
  src: string;
  sizes?: string;
  type?: string;
  purpose?: string;
  form_factor?: string;
  label?: string;
}

interface PwaManifestShape {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  background_color?: string;
  theme_color?: string;
  icons?: ManifestAsset[];
  screenshots?: ManifestAsset[];
}

export interface PwaHealthCheck {
  key: string;
  label: string;
  status: HealthStatus;
  detail: string;
}

export interface PwaHealthSnapshot {
  status: HealthStatus;
  manifestPath: string;
  checks: PwaHealthCheck[];
  missingAssets: string[];
}

const ROOT = process.cwd();
const STATIC_MANIFEST_PATH = path.join(ROOT, "public", "manifest.json");
const SERVICE_WORKER_PATH = path.join(ROOT, "src", "app", "sw.ts");

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isAssetArray(value: unknown): value is ManifestAsset[] {
  return (
    Array.isArray(value) &&
    value.every((asset) => isRecord(asset) && typeof asset.src === "string")
  );
}

function readManifestShape(value: unknown): PwaManifestShape {
  if (!isRecord(value)) return {};

  return {
    name: typeof value.name === "string" ? value.name : undefined,
    short_name: typeof value.short_name === "string" ? value.short_name : undefined,
    start_url: typeof value.start_url === "string" ? value.start_url : undefined,
    display: typeof value.display === "string" ? value.display : undefined,
    background_color:
      typeof value.background_color === "string" ? value.background_color : undefined,
    theme_color: typeof value.theme_color === "string" ? value.theme_color : undefined,
    icons: isAssetArray(value.icons) ? value.icons : [],
    screenshots: isAssetArray(value.screenshots) ? value.screenshots : [],
  };
}

function publicAssetPath(src: string) {
  if (!src.startsWith("/") || src.startsWith("//")) return null;
  return path.join(ROOT, "public", src.replace(/^\/+/, ""));
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolveStatus(checks: PwaHealthCheck[]): HealthStatus {
  if (checks.some((check) => check.status === "critical")) return "critical";
  if (checks.some((check) => check.status === "warning")) return "warning";
  return "ok";
}

export async function getPwaHealth(): Promise<PwaHealthSnapshot> {
  const checks: PwaHealthCheck[] = [];
  const missingAssets: string[] = [];

  try {
    const manifestRaw = await fs.readFile(STATIC_MANIFEST_PATH, "utf8");
    const manifest = readManifestShape(JSON.parse(manifestRaw));

    checks.push({
      key: "manifest",
      label: "Manifest",
      status: "ok",
      detail: "Static manifest is readable.",
    });

    const hasInstallBasics = Boolean(
      manifest.name &&
        manifest.short_name &&
        manifest.start_url &&
        manifest.display &&
        manifest.theme_color &&
        manifest.background_color
    );

    checks.push({
      key: "install-basics",
      label: "Install metadata",
      status: hasInstallBasics ? "ok" : "warning",
      detail: hasInstallBasics
        ? "Required install fields are present."
        : "Manifest is missing one or more install fields.",
    });

    const icons = manifest.icons ?? [];
    const screenshots = manifest.screenshots ?? [];
    const assets = [...icons, ...screenshots];

    await Promise.all(
      assets.map(async (asset) => {
        const filePath = publicAssetPath(asset.src);
        if (!filePath) return;
        if (!(await exists(filePath))) {
          missingAssets.push(asset.src);
        }
      })
    );

    checks.push({
      key: "icons",
      label: "Icons",
      status:
        icons.length > 0 && icons.every((icon) => !missingAssets.includes(icon.src))
          ? "ok"
          : "critical",
      detail:
        icons.length > 0
          ? `${icons.length} icon asset${icons.length === 1 ? "" : "s"} configured.`
          : "No icon assets are configured.",
    });

    checks.push({
      key: "screenshots",
      label: "Screenshots",
      status:
        screenshots.length > 0 && screenshots.every((shot) => !missingAssets.includes(shot.src))
          ? "ok"
          : "warning",
      detail:
        screenshots.length > 0
          ? `${screenshots.length} screenshot asset${screenshots.length === 1 ? "" : "s"} configured.`
          : "No install screenshots are configured.",
    });

    const serviceWorker = await fs.readFile(SERVICE_WORKER_PATH, "utf8").catch(() => "");
    const apiCacheExclusions = ["/download", "/stream", "/waveform", "/access"];
    const missingExclusions = apiCacheExclusions.filter(
      (segment) => !serviceWorker.includes(`!url.pathname.includes("${segment}")`)
    );

    checks.push({
      key: "api-cache-exclusions",
      label: "Protected audio routes",
      status: missingExclusions.length === 0 ? "ok" : "critical",
      detail:
        missingExclusions.length === 0
          ? "Download, stream, waveform, and access routes are excluded from runtime API cache."
          : `Missing cache exclusions: ${missingExclusions.join(", ")}`,
    });
  } catch (error) {
    checks.push({
      key: "manifest",
      label: "Manifest",
      status: "critical",
      detail: error instanceof Error ? error.message : "Manifest could not be read.",
    });
  }

  return {
    status: resolveStatus(checks),
    manifestPath: STATIC_MANIFEST_PATH,
    checks,
    missingAssets,
  };
}
