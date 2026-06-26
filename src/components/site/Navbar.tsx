import { Link } from "@tanstack/react-router";
import { useI18n } from "@/hooks/use-i18n";
import { useCart } from "@/hooks/use-cart";
import { dict } from "@/lib/translations";
import { ShoppingBag, Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import yasLogo from "@/assets/yas-logo-navy.png";

export function Navbar() {
  const { lang, setLang } = useI18n();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: dict.nav.home[lang] },
    { to: "/booking", label: dict.nav.booking[lang] },
    { to: "/shop", label: dict.nav.shop[lang] },
    { to: "/portfolio", label: dict.nav.portfolio[lang] },
    { to: "/about", label: dict.nav.about[lang] },
    { to: "/contact", label: dict.nav.contact[lang] },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" aria-label="YAS" className="flex items-center">
          <img
            src={yasLogo}
            alt="YAS"
            className="h-9 w-auto md:h-10"
            loading="eager"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            aria-label="Switch language"
          >
            <Globe className="h-4 w-4" />
            {lang === "en" ? "AR" : "EN"}
          </button>
          <Link to="/cart" className="relative text-muted-foreground hover:text-foreground" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}