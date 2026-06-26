import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/hooks/use-i18n";
import { dict } from "@/lib/translations";
import { SITE, formatIQD } from "@/lib/site-config";
import heroVideo from "@/assets/hero-video.mp4";
import { ChevronRight, Scissors, Calendar, User2, Check } from "lucide-react";
import yasLogoWhite from "@/assets/yas-logo-white.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.nameAr} | ${SITE.nameEn} — ${SITE.taglineAr} | ${SITE.taglineEn}` },
      {
        name: "description",
        content: "YAS Barbershop in Baghdad — Premium grooming, haircuts, fades, and classic shaves. Book online. صالون ياس للحلاقة في بغداد - حلاقة شعر وتحديد لحية وعناية متكاملة للرجال. احجز موعدك الآن.",
      },
      { property: "og:title", content: `${SITE.nameAr} | ${SITE.nameEn} Barbershop` },
      { property: "og:description", content: `${SITE.taglineAr} | ${SITE.taglineEn}` },
    ],
  }),
  component: Home,
});

function Home() {
  const { lang } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: portfolio } = useQuery({
    queryKey: ["portfolio", "teaser"],
    queryFn: async () => {
      const { data } = await supabase
        .from("portfolio_items")
        .select("*")
        .order("sort_order")
        .limit(4);
      return data ?? [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products", "teaser"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const fromLeft = gsap.utils.toArray<HTMLElement>(".reveal-left");
      const fromRight = gsap.utils.toArray<HTMLElement>(".reveal-right");
      const fromUp = gsap.utils.toArray<HTMLElement>(".reveal-up");

      const build = (els: HTMLElement[], fromVars: gsap.TweenVars) => {
        els.forEach((el) => {
          gsap.fromTo(
            el,
            { ...fromVars, opacity: 0 },
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                end: "top 20%",
                toggleActions: "play reverse play reverse",
              },
            },
          );
        });
      };

      build(fromLeft, { x: -120 });
      build(fromRight, { x: 120 });
      build(fromUp, { y: 80 });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <SiteLayout>
    <div ref={rootRef}>
      <h1 className="sr-only">
        YAS Barbershop — Premium Grooming & Haircuts in Baghdad | صالون ياس - حلاقة وعناية رجالية راقية في بغداد
      </h1>
      {/* SECTION 1 — HERO with looping video background */}
      <section className="relative h-[92vh] min-h-[600px] w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src={heroVideo}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <img
            src={yasLogoWhite}
            alt="YAS"
            className="h-44 w-auto sm:h-52 md:h-64"
          />
          <Link
            to="/booking"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-display text-sm uppercase tracking-widest text-black transition-colors hover:bg-white/90"
          >
            {dict.home.bookNow[lang]} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* SECTION 2 — PORTFOLIO TEASER (board / our work) */}
      <section className="panel px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between">
            <div className="reveal-left">
              <h2 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-6xl">
                {dict.home.portfolioTitle[lang]}
              </h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">{dict.home.portfolioBlurb[lang]}</p>
            </div>
            <Link
              to="/portfolio"
              className="reveal-right hidden items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground md:inline-flex"
            >
              {dict.home.viewAll[lang]} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="reveal-up grid grid-cols-2 gap-1 md:grid-cols-4">
            {(portfolio ?? []).map((p) => (
              <div key={p.id} className="aspect-square overflow-hidden bg-card">
                {p.type === "video" ? (
                  <video src={p.url} muted loop autoPlay playsInline className="h-full w-full object-cover" />
                ) : (
                  <img src={p.url} alt={p.title_en ?? ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — BOOKING EXPLAINER */}
      <section className="panel panel-alt px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="reveal-left">
            <h2 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-6xl">
              {dict.home.processTitle[lang]}
            </h2>
          </div>
          <div className="reveal-up mt-12 grid gap-6 md:grid-cols-4">
            {[
              { icon: Scissors, text: dict.home.step1[lang] },
              { icon: User2, text: dict.home.step2[lang] },
              { icon: Calendar, text: dict.home.step3[lang] },
              { icon: Check, text: dict.home.step4[lang] },
            ].map((s, i) => (
              <div key={i} className="border border-border bg-background p-6">
                <s.icon className="h-6 w-6 text-primary" />
                <div className="mt-4 font-display text-3xl text-muted-foreground">0{i + 1}</div>
                <div className="mt-2 text-sm">{s.text}</div>
              </div>
            ))}
          </div>
          <p className="reveal-left mt-8 max-w-2xl text-sm text-muted-foreground">{dict.home.bookingNote[lang]}</p>
          <Link
            to="/booking"
            className="reveal-right mt-6 inline-flex items-center gap-2 bg-primary px-8 py-3 font-display uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
          >
            {dict.home.startBooking[lang]} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* SECTION 4 — SHOP TEASER */}
      <section className="panel px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between">
            <div className="reveal-left">
              <h2 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-6xl">
                {dict.home.shopHeading[lang]}
              </h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">{dict.home.shopBlurb[lang]}</p>
            </div>
            <Link
              to="/shop"
              className="reveal-right hidden items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground md:inline-flex"
            >
              {dict.home.visitShop[lang]} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="reveal-up grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {(products ?? []).map((p) => (
              <Link key={p.id} to="/shop" className="group block border border-border bg-card">
                <div className="aspect-square overflow-hidden bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt={lang === "ar" ? p.name_ar : p.name_en} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">—</div>
                  )}
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm">{lang === "ar" ? p.name_ar : p.name_en}</span>
                  <span className="font-display text-primary">{formatIQD(p.discount_price_iqd ?? p.price_iqd, lang)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
    </SiteLayout>
  );
}
