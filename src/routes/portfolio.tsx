import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/hooks/use-i18n";
import { dict } from "@/lib/translations";
import { SITE } from "@/lib/site-config";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: `Portfolio & Styles | معرض الأعمال والقصات — ${SITE.nameEn}` },
      {
        name: "description",
        content: "Check out our latest haircuts, fades, shaves, and grooming styles at YAS Barbershop. شاهد أحدث قصات وتحديدات اللحية وتصاميم الشعر الاحترافية من صالون ياس.",
      },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const { lang } = useI18n();
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const { data: items = [] } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => (await supabase.from("portfolio_items").select("*").order("sort_order")).data ?? [],
  });
  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-6xl">{dict.portfolio.title[lang]}</h1>
        <div className="mt-8 flex gap-2">
          {(["all", "image", "video"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`border px-4 py-2 text-xs uppercase tracking-widest ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
            >
              {f === "all" ? dict.portfolio.all[lang] : f === "image" ? dict.portfolio.photos[lang] : dict.portfolio.videos[lang]}
            </button>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="aspect-square overflow-hidden bg-card">
              {p.type === "video" ? (
                <video src={p.url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
              ) : (
                <img src={p.url} alt={p.title_en ?? ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              )}
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}