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
