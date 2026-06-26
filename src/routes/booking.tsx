import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/hooks/use-i18n";
import { dict } from "@/lib/translations";
import { SITE, formatIQD } from "@/lib/site-config";
import { generateSlots, isSlotTaken, todayISO } from "@/lib/booking";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { Lang } from "@/lib/translations";

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_AR = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function DayPicker({ lang, value, onChange }: { lang: Lang; value: string; onChange: (d: string) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  return (
    <div className="mt-6 -mx-4 overflow-x-auto px-4">
      <div className="flex gap-3 pb-2">
        {days.map((d) => {
          const iso = toISO(d);
          const active = iso === value;
          const dayName = (lang === "ar" ? DAY_NAMES_AR : DAY_NAMES_EN)[d.getDay()];
          const monthName = (lang === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN)[d.getMonth()];
          return (
            <button
              key={iso}
              onClick={() => onChange(iso)}
              className={`flex w-20 flex-none flex-col items-center gap-1 rounded-2xl border px-3 py-4 transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-foreground"
              }`}
            >
              <span className={`text-xs uppercase tracking-wider ${active ? "opacity-90" : "text-muted-foreground"}`}>{dayName}</span>
              <span className="font-display text-2xl">{d.getDate()}</span>
              <span className={`text-[10px] uppercase tracking-wider ${active ? "opacity-90" : "text-muted-foreground"}`}>{monthName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: `Book an Appointment | احجز موعدك — ${SITE.nameEn}` },
      {
        name: "description",
        content: "Easy online booking for haircuts and grooming services at YAS Barbershop. احجز موعدك للحلاقة والعناية بالبشرة بسهولة عبر الإنترنت مع صالون ياس.",
      },
    ],
  }),
  component: Booking,
});

function Booking() {
  const { lang } = useI18n();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [slotIdx, setSlotIdx] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("*").eq("active", true).order("sort_order")).data ?? [],
  });
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
  const { data: prices = [] } = useQuery({
    queryKey: ["barber-services"],
    queryFn: async () => (await supabase.from("barber_services").select("*")).data ?? [],
  });
  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ["bookings", date],
    queryFn: async () => {
      const start = `${date}T00:00:00`;
      const end = `${date}T23:59:59`;
      const { data } = await supabase
        .from("bookings")
        .select("starts_at, ends_at, barber_id, status")
        .gte("starts_at", start)
        .lte("starts_at", end);
      return data ?? [];
    },
  });

  const slots = useMemo(() => generateSlots(date), [date]);

  const priceFor = (bId: string, sId: string) =>
    prices.find((p) => p.barber_id === bId && p.service_id === sId)?.price_iqd ?? 0;

  const currentService = services.find((s) => s.id === serviceId);
  const currentBarber = barbers.find((b) => b.id === barberId);
  const currentPrice = serviceId && barberId ? priceFor(barberId, serviceId) : 0;
  const currentSlot = slotIdx !== null ? slots[slotIdx] : null;

  const submit = async () => {
    if (!serviceId || !barberId || !currentSlot || !name || !phone) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      // upsert customer via security-definer RPC (no public read on customers)
      const { data: customerId, error: custErr } = await supabase.rpc("upsert_customer_by_phone", {
        _name: name,
        _phone: phone,
      });
      if (custErr || !customerId) throw custErr ?? new Error("Customer lookup failed");

      const { error: bookErr } = await supabase.from("bookings").insert({
        customer_id: customerId as string,
        barber_id: barberId,
        service_id: serviceId,
        starts_at: currentSlot.startsAt.toISOString(),
        ends_at: currentSlot.endsAt.toISOString(),
        price_iqd: currentPrice,
        notes,
        status: "pending",
      });
      if (bookErr) throw bookErr;
      setDone(true);
      refetchBookings();
    } catch (e: any) {
      toast.error(e.message ?? "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-2xl px-4 py-32 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-4xl uppercase tracking-wider">{dict.booking.success[lang]}</h1>
          <p className="mt-3 text-muted-foreground">{dict.booking.successBody[lang]}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setDone(false);
                setStep(1);
                setServiceId(null);
                setBarberId(null);
                setSlotIdx(null);
                setName("");
                setPhone("");
                setNotes("");
              }}
              className="border border-border px-6 py-3 text-sm uppercase tracking-widest hover:bg-card"
            >
              {dict.booking.bookAnother[lang]}
            </button>
            <Link to="/" className="bg-primary px-6 py-3 text-sm uppercase tracking-widest text-primary-foreground hover:bg-primary/90">
              {dict.nav.home[lang]}
            </Link>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-6xl">{dict.booking.title[lang]}</h1>

        {/* progress */}
        <div className="mt-8 flex items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`h-1 flex-1 ${n <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <div className="mt-12">
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wider">{dict.booking.chooseService[lang]}</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={`border p-4 text-start ${serviceId === s.id ? "border-primary bg-card" : "border-border hover:border-muted-foreground"}`}
                  >
                    <div className="font-display text-lg">{lang === "ar" ? s.name_ar : s.name_en}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{s.duration_minutes} min</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wider">{dict.booking.chooseBarber[lang]}</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {barbers.map((b) => {
                  const p = serviceId ? priceFor(b.id, serviceId) : 0;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBarberId(b.id)}
                      className={`flex items-center gap-4 border p-4 text-start ${barberId === b.id ? "border-primary bg-card" : "border-border hover:border-muted-foreground"}`}
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
                        {b.photo_url && <img src={b.photo_url} alt={b.name_en} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-display text-lg">{lang === "ar" ? b.name_ar : b.name_en}</div>
                        <div className="text-xs text-muted-foreground">{lang === "ar" ? b.experience_ar : b.experience_en}</div>
                      </div>
                      <div className="font-display text-primary">{p ? formatIQD(p, lang) : "—"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wider">{dict.booking.chooseDate[lang]}</h2>
              <DayPicker
                lang={lang}
                value={date}
                onChange={(d) => {
                  setDate(d);
                  setSlotIdx(null);
                }}
              />
              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                {slots.length === 0 && <div className="col-span-full text-sm text-muted-foreground">{dict.booking.noSlots[lang]}</div>}
                {slots.map((s, i) => {
                  const taken = barberId ? isSlotTaken(s, bookings, barberId) : false;
                  return (
                    <button
                      key={i}
                      disabled={taken}
                      onClick={() => setSlotIdx(i)}
                      className={`border p-2 text-sm ${slotIdx === i ? "border-primary bg-primary text-primary-foreground" : taken ? "border-border text-muted-foreground line-through opacity-50" : "border-border hover:border-foreground"}`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wider">{dict.booking.yourDetails[lang]}</h2>
              <div className="mt-6 grid gap-4">
                <input
                  type="text"
                  placeholder={dict.booking.name[lang]}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-border bg-background p-3"
                />
                <input
                  type="tel"
                  placeholder={dict.booking.phone[lang]}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-border bg-background p-3"
                />
                <textarea
                  placeholder={dict.booking.notes[lang]}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="border border-border bg-background p-3"
                />
              </div>
              <div className="mt-6 border border-border bg-card p-4 text-sm">
                <div className="flex justify-between"><span>{currentService && (lang === "ar" ? currentService.name_ar : currentService.name_en)}</span><span className="text-muted-foreground">{currentBarber && (lang === "ar" ? currentBarber.name_ar : currentBarber.name_en)}</span></div>
                <div className="mt-2 flex justify-between"><span>{date} · {currentSlot?.label}</span><span className="font-display text-primary">{formatIQD(currentPrice, lang)}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="inline-flex items-center gap-1 border border-border px-6 py-3 text-sm uppercase tracking-widest disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> {dict.booking.back[lang]}
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !serviceId) || (step === 2 && !barberId) || (step === 3 && slotIdx === null)}
              className="inline-flex items-center gap-1 bg-primary px-6 py-3 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-30"
            >
              {dict.booking.next[lang]} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting || !name || !phone}
              className="bg-primary px-6 py-3 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-30"
            >
              {dict.booking.confirm[lang]}
            </button>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}