import { useI18n } from "@/hooks/use-i18n";
import { SITE } from "@/lib/site-config";
import { dict } from "@/lib/translations";
import yasLogo from "@/assets/yas-logo-navy.png";
import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { ReactElement } from "react";

// ── Inline brand SVGs (Lucide doesn't have Instagram / TikTok) ──────────────
function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  );
}

// ── Social links config ──────────────────────────────────────────────────────
// Icons are always rendered. Once you fill in a URL in site-config.ts the
// anchor becomes clickable; until then it's just a visual placeholder.
const SOCIALS: Array<{ key: string; url: string; Icon: () => ReactElement; label: string }> = [
  { key: "instagram", url: SITE.instagramUrl, Icon: InstagramIcon, label: "Instagram" },
  { key: "tiktok",    url: SITE.tiktokUrl,    Icon: TikTokIcon,    label: "TikTok"    },
  { key: "website",   url: SITE.mapsUrl,       Icon: () => <MapPin size={22} />, label: "Location on Maps" },
];

export function Footer() {
  const { lang } = useI18n();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        {/* ── Brand + social ─────────────────────────────────────────────── */}
        <div>
          <img src={yasLogo} alt="YAS" className="h-12 w-auto" />
          <p className="mt-3 text-sm text-muted-foreground">
            {lang === "ar" ? SITE.taglineAr : SITE.taglineEn}
          </p>

          {/* Social icons — always visible; add URLs in site-config.ts */}
          <div className="mt-4 flex items-center gap-4">
            {SOCIALS.map(({ key, url, Icon, label }) =>
              url ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={
                    "text-muted-foreground transition-all duration-200 ease-out " +
                    "hover:text-foreground hover:scale-125 " +
                    (key === "website"
                      ? "hover:-translate-y-0.5"
                      : key === "instagram"
                      ? "hover:rotate-6"
                      : "hover:-rotate-6")
                  }
                  style={{ display: "inline-flex" }}
                >
                  <Icon />
                </a>
              ) : (
                <span
                  key={key}
                  aria-label={label}
                  title={`${label} — add URL in site-config.ts`}
                  className="inline-flex text-muted-foreground/35 cursor-default"
                >
                  <Icon />
                </span>
              )
            )}
          </div>
        </div>

        {/* ── Contact ────────────────────────────────────────────────────── */}
        <div className="text-sm text-muted-foreground">
          <div>{SITE.address}</div>
          <div className="mt-1">{SITE.phone}</div>
          <div className="mt-1">{SITE.email}</div>
        </div>

        {/* ── Credits / admin ────────────────────────────────────────────── */}
        <div className="text-sm text-muted-foreground md:text-end">
          <div>{dict.common.footer[lang]}</div>
          {/* <div className="mt-1"> {new Date().getFullYear()} · {dict.common.rights[lang]}</div> */}
          <Link
            to="/admin"
            className="mt-3 inline-block text-xs uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {lang === "ar" ? "الدخول" : "Access"}
          </Link>
        </div>
      </div>
    </footer>
  );
}