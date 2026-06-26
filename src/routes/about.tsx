import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/hooks/use-i18n";
import { dict } from "@/lib/translations";
import { SITE } from "@/lib/site-config";
import { toast } from "sonner";
import { Star } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About & Reviews | من نحن وآراء العملاء — ${SITE.nameEn}` },
      {
        name: "description",
        content: "Get to know the professional barbers at YAS, view customer reviews, and share your experience. تعرف على فريق الحلاقين المحترفين في صالون ياس واقرأ تقييمات زبائننا.",
      },
    ],
  }),
  component: About,
});

function About() {
  const { lang } = useI18n();
  const [openBarberId, setOpenBarberId] = useState<string | null>(null);
  const { data: barbers = [] } = useQuery({
    queryKey: ["barbers"],
    queryFn: async () =>
      (
        await supabase
          .from("barbers")
          .select("id, name_ar, name_en, bio_ar, bio_en, experience_ar, experience_en, photo_url, sort_order, active")
          .eq("active", true)
          .order("sort_order")
      ).data ?? [],
  });
  const { data: reviews = [], refetch } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => (await supabase.from("reviews").select("*").eq("approved", true)).data ?? [],
  });

  const statsFor = (barberId: string) => {
    const r = reviews.filter((x) => x.barber_id === barberId);
    if (r.length === 0) return { avg: 0, count: 0 };
    return { avg: r.reduce((s, x) => s + x.rating, 0) / r.length, count: r.length };
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-6xl">{dict.about.title[lang]}</h1>
        <p className="mt-6 max-w-2xl text-muted-foreground">{dict.about.body[lang]}</p>
      </section>

      <section className="panel panel-alt px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl uppercase tracking-wider">{dict.about.barbersTitle[lang]}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {barbers.map((b) => {
              const s = statsFor(b.id);
              return (
                <div key={b.id} className="border border-border bg-background">
                  <div className="aspect-[3/4] overflow-hidden bg-muted">
                    {b.photo_url && <img src={b.photo_url} alt={b.name_en} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-4">
                    <div className="font-display text-xl uppercase tracking-wider">{lang === "ar" ? b.name_ar : b.name_en}</div>
                    <div className="text-xs text-muted-foreground">{lang === "ar" ? b.experience_ar : b.experience_en}</div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <Stars value={s.avg} />
                      <span className="text-muted-foreground">{s.count} {dict.about.reviewsCount[lang]}</span>
                    </div>
                    <button
                      onClick={() => setOpenBarberId(b.id)}
                      className="mt-4 w-full border border-border py-2 text-xs uppercase tracking-widest hover:border-primary"
                    >
                      {dict.about.rateBarber[lang]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {openBarberId && (
        <RateDialog
          barberId={openBarberId}
          onClose={() => setOpenBarberId(null)}
          onSaved={() => {
            refetch();
            setOpenBarberId(null);
          }}
          lang={lang}
        />
      )}
    </SiteLayout>
  );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground"}
        />
      ))}
    </div>
  );
}

function RateDialog({
  barberId,
  onClose,
  onSaved,
  lang,
}: {
  barberId: string;
  onClose: () => void;
  onSaved: () => void;
  lang: "en" | "ar";
}) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({ barber_id: barberId, customer_name: name, rating, comment });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Thanks!");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl uppercase tracking-wider">{dict.about.rateBarber[lang]}</h3>
        <div className="mt-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star width={28} height={28} className={n <= rating ? "fill-primary text-primary" : "text-muted-foreground"} />
            </button>
          ))}
        </div>
        <input className="mt-4 w-full border border-border bg-background p-3 text-sm" placeholder={dict.about.yourName[lang]} value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="mt-3 w-full border border-border bg-background p-3 text-sm" rows={3} placeholder={dict.about.comment[lang]} value={comment} onChange={(e) => setComment(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 border border-border py-2 text-xs uppercase tracking-widest">
            {dict.admin.cancel[lang]}
          </button>
          <button onClick={submit} disabled={submitting || !name} className="flex-1 bg-primary py-2 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-30">
            {dict.about.submitRating[lang]}
          </button>
        </div>
      </div>
    </div>
  );
}