import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readThemeEntry, themePublicBase } from "@/lib/themes/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bootstrap(destination: string, countdown: number): string {
  const cfg = JSON.stringify({ destination, countdown }).replace(/</g, "\\u003c");
  return `<script>(function(){
  var T = ${cfg};
  window.TRIMLY = T;
  function redirect(){ try { (window.top || window).location.replace(T.destination); } catch(e){ window.location.replace(T.destination); } }
  function ready(){
    document.querySelectorAll('[data-trimly-continue]').forEach(function(el){
      el.addEventListener('click', function(e){ e.preventDefault(); redirect(); });
    });
    var els = document.querySelectorAll('[data-trimly-countdown]');
    var n = T.countdown;
    els.forEach(function(el){ el.textContent = String(n); });
    if (n <= 0) { redirect(); return; }
    var iv = setInterval(function(){
      n--; els.forEach(function(el){ el.textContent = String(n); });
      if (n <= 0) { clearInterval(iv); redirect(); }
    }, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();</script>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const to = req.nextUrl.searchParams.get("to") || "";
  const cParam = req.nextUrl.searchParams.get("c");

  if (!/^https?:\/\//i.test(to)) {
    return new NextResponse("Invalid destination", { status: 400 });
  }

  const theme = await prisma.theme.findUnique({ where: { slug } });
  if (!theme || theme.status !== "ENABLED" || !theme.entryHtml) {
    return new NextResponse("Theme not available", { status: 404 });
  }

  const countdown = cParam != null ? Math.max(0, Math.min(60, Number(cParam) || 0)) : theme.countdownDefault;

  let html = await readThemeEntry(slug, theme.entryHtml);
  if (html == null) return new NextResponse("Theme entry missing", { status: 404 });

  // Inject <base> so relative asset paths resolve, and the bootstrap script.
  const baseTag = `<base href="${themePublicBase(slug)}/">`;
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  } else {
    html = `${baseTag}${html}`;
  }
  const boot = bootstrap(to, countdown);
  if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `${boot}</body>`);
  } else {
    html = `${html}${boot}`;
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-frame-options": "SAMEORIGIN",
      "content-security-policy": "frame-ancestors 'self'",
    },
  });
}
