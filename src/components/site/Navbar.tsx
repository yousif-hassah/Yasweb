import { Link } from "@tanstack/react-router";
import { useI18n } from "@/hooks/use-i18n";
import { useCart } from "@/hooks/use-cart";
import { dict } from "@/lib/translations";
import { ShoppingBag, Globe, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import yasLogo from "@/assets/yas-logo-navy.png";

export function Navbar() {
  const { lang, setLang } = useI18n();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  const links = [
    { to: "/", label: dict.nav.home[lang] },
    { to: "/booking", label: dict.nav.booking[lang] },
    { to: "/shop", label: dict.nav.shop[lang] },
    { to: "/portfolio", label: dict.nav.portfolio[lang] },
    { to: "/about", label: dict.nav.about[lang] },
    { to: "/contact", label: dict.nav.contact[lang] },
  ];

  // Animate menu open/close
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    if (open) {
      // Cancel any closing animation
      isAnimating.current = true;
      el.style.display = "block";
      // Force reflow before animating
      el.getBoundingClientRect();
      el.style.transition = "opacity 0.32s ease, transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      const t = setTimeout(() => { isAnimating.current = false; }, 400);
      return () => clearTimeout(t);
    } else {
      isAnimating.current = true;
      el.style.transition = "opacity 0.22s ease, transform 0.26s ease";
      el.style.opacity = "0";
      el.style.transform = "translateY(-10px)";
      const timer = setTimeout(() => {
        if (el) el.style.display = "none";
        isAnimating.current = false;
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Set initial hidden state on mount
  useEffect(() => {
    const el = menuRef.current;
    if (el) {
      el.style.display = "none";
      el.style.opacity = "0";
      el.style.transform = "translateY(-10px)";
    }
  }, []);

  const toggle = () => setOpen((v) => !v);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo — bigger on mobile */}
        <Link to="/" aria-label="YAS" className="flex items-center">
          <img
            src={yasLogo}
            alt="YAS"
            className="h-11 w-auto md:h-13"
            loading="eager"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-200"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Switch language"
          >
            <Globe className="h-4 w-4" />
            {lang === "en" ? "AR" : "EN"}
          </button>

          <Link to="/cart" className="relative text-muted-foreground hover:text-foreground transition-colors duration-200" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          {/* Hamburger — simple, reliable toggle button */}
          <button
            className="md:hidden relative h-8 w-8 flex items-center justify-center text-foreground"
            onClick={toggle}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {/* Menu icon */}
            <span
              className="absolute transition-all duration-300"
              style={{
                opacity: open ? 0 : 1,
                transform: open ? "rotate(45deg) scale(0)" : "rotate(0deg) scale(1)",
              }}
            >
              <Menu className="h-5 w-5" />
            </span>
            {/* X icon */}
            <span
              className="absolute transition-all duration-300"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "rotate(0deg) scale(1)" : "rotate(-45deg) scale(0)",
              }}
            >
              <X className="h-5 w-5" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu — CSS animated via useEffect, no outside-click interference */}
      <div
        ref={menuRef}
        className="md:hidden border-t border-border bg-background/95 backdrop-blur-md shadow-lg"
      >
        <nav className="mx-auto flex max-w-7xl flex-col px-4 py-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="group flex items-center justify-between border-b border-border/50 py-4 text-sm uppercase tracking-wider text-muted-foreground transition-colors duration-200 last:border-0 hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              <span>{l.label}</span>
              <span className="text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}