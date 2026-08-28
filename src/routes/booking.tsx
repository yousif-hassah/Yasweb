import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/hooks/use-i18n";
import { dict } from "@/lib/translations";
import { SITE, formatIQD, normalizePhoneDigits } from "@/lib/site-config";
import { generateSlots, isSlotTaken, todayISO } from "@/lib/booking";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { Lang } from "@/lib/translations";
import { getMediaUrl } from "@/lib/image-utils";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";

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
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("*").eq("active", true).order("sort_order")).data ?? [],
    staleTime: 10 * 60 * 1000, // Services rarely change
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
    staleTime: 10 * 60 * 1000, // Barbers list rarely changes
  });
  const { data: prices = [] } = useQuery({
    queryKey: ["barber-services"],
    queryFn: async () => (await supabase.from("barber_services").select("*")).data ?? [],
    staleTime: 10 * 60 * 1000, // Prices rarely change
  });
  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ["bookings", date],
    queryFn: async () => {
      // Use explicit Baghdad offset (+03:00) so Postgres filters by local date,
      // not UTC date. Without this a 12PM booking (09:00 UTC) could appear on
      // the wrong day when the UTC date differs from the Baghdad date.
      const start = `${date}T00:00:00+03:00`;
      const end = `${date}T23:59:59+03:00`;
      const { data } = await supabase
        .from("bookings")
        .select("starts_at, ends_at, barber_id, status")
        .gte("starts_at", start)
        .lte("starts_at", end);
      return data ?? [];
    },
    staleTime: 3 * 60 * 1000, // Bookings: 3 minute cache (time-sensitive but not polling)
  });
  // Fetch ALL blocked days for the next 30 days at once — filtered client-side.
  // This prevents a new Supabase request on every date/barber change.
  const { data: allBlockedDays = [] } = useQuery({
    queryKey: ["blocked-days-range"],
    queryFn: async () => {
      const db = supabase as any;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const from = today.toISOString().slice(0, 10);
      const to = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const { data } = await db
        .from("blocked_days")
        .select("date, barber_id")
        .gte("date", from)
        .lte("date", to);
      return (data ?? []) as { date: string; barber_id: string | null }[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
  // Filter client-side for the selected date & barber
  const blockedDaysData = allBlockedDays.filter(
    (d) =>
      d.date === date &&
      (d.barber_id === null || d.barber_id === barberId),
  );
  // Full-shop block (no barber_id) disables all slots
  const isShopDayBlocked = (blockedDaysData as any[]).some((d: any) => !d.barber_id);
  // Barber-specific block — only relevant after barber is chosen
  const isBarberDayBlocked = barberId
    ? (blockedDaysData as any[]).some((d: any) => d.barber_id === barberId)
    : false;
  const isDayBlocked = isShopDayBlocked || isBarberDayBlocked;

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
      // Fast client-side check using cached data (avoid extra API call for common case)
      const cachedBlocked = allBlockedDays.filter(
        (d) => d.date === date && (d.barber_id === null || d.barber_id === barberId),
      );
      // Validate that slot starts on top of the hour within shop opening hours (Baghdad time)
      const slotUtc = new Date(currentSlot.startsAt.toISOString());
      const baghdadDate = new Date(slotUtc.getTime() + 3 * 60 * 60 * 1000);
      const bHour = baghdadDate.getUTCHours();
      const bMin = baghdadDate.getUTCMinutes();

      if (bMin !== 0 || bHour < SITE.openingHourLocal || bHour >= SITE.closingHourLocal) {
        throw new Error(
          lang === "ar"
            ? "عذراً، الموعد المختار غير متاح ضمن ساعات العمل الرسمية."
            : "Sorry, the selected time slot is outside shop working hours."
        );
      }

      // Double check for double booking/overlap in DB
      const { data: slotConflict, error: conflictErr } = await supabase
        .from("bookings")
        .select("id")
        .eq("barber_id", barberId)
        .neq("status", "cancelled")
        .neq("status", "no_show")
        .lt("starts_at", currentSlot.endsAt.toISOString())
        .gt("ends_at", currentSlot.startsAt.toISOString());

      if (conflictErr) throw conflictErr;
      if (slotConflict && slotConflict.length > 0) {
        throw new Error(lang === "ar" ? "عذراً، هذا الموعد تم حجزه للتو من قبل شخص آخر." : "Sorry, this time slot has just been booked by someone else.");
      }

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
                        {b.photo_url && <img src={getMediaUrl(b.photo_url)} alt={b.name_en} className="h-full w-full object-cover" />}
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
              {isDayBlocked ? (
                <div className="mt-6 rounded border border-rose-500/40 bg-rose-500/5 p-6 text-center">
                  <p className="font-display text-lg text-rose-600">
                    {isBarberDayBlocked && !isShopDayBlocked
                      ? (lang === "ar" ? "❌ هذا الحلاق غير متوفر في هذا اليوم." : "❌ This barber is unavailable on this day.")
                      : (lang === "ar" ? "❌ هذا اليوم مغلق ولا تتوفر حجوزات." : "❌ This day is closed. No bookings available.")}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isBarberDayBlocked && !isShopDayBlocked
                      ? (lang === "ar" ? "يُرجى اختيار يوم آخر أو اختيار حلاق مختلف." : "Please select a different day or choose another barber.")
                      : (lang === "ar" ? "يُرجى اختيار يوم آخر." : "Please select a different day.")}
                  </p>
                </div>
              ) : (
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
              )}
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
                <PhoneInputWithCountry
                  value={phone}
                  onChange={setPhone}
                  lang={lang}
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
            disabled={step === 1 || checking}
            className="inline-flex items-center gap-1 border border-border px-6 py-3 text-sm uppercase tracking-widest disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> {dict.booking.back[lang]}
          </button>
          {step < 4 ? (
            <button
              onClick={async () => {
                // Step 3 → 4: verify slot is still free directly in DB
                if (step === 3 && slotIdx !== null && barberId && currentSlot) {
                  setChecking(true);
                  try {
                    const { data: conflict } = await supabase
                      .from("bookings")
                      .select("id")
                      .eq("barber_id", barberId)
                      .neq("status", "cancelled")
                      .neq("status", "no_show")
                      .lt("starts_at", currentSlot.endsAt.toISOString())
                      .gt("ends_at", currentSlot.startsAt.toISOString());

                    if (conflict && conflict.length > 0) {
                      // Slot was taken — refresh cache and block navigation
                      await refetchBookings();
                      setSlotIdx(null);
                      toast.error(
                        lang === "ar"
                          ? "⚠️ هذا الموعد تم حجزه للتو، يرجى اختيار وقت آخر."
                          : "⚠️ This slot was just booked. Please choose another time.",
                      );
                      return; // ← لا ينتقل للخطوة 4
                    }
                  } catch {
                    // On network error, allow proceeding — submit will catch it
                  } finally {
                    setChecking(false);
                  }
                }
                setStep(step + 1);
              }}
              disabled={
                checking ||
                (step === 1 && !serviceId) ||
                (step === 2 && !barberId) ||
                (step === 3 && (slotIdx === null || isDayBlocked))
              }
              className="inline-flex items-center gap-1 bg-primary px-6 py-3 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-30"
            >
              {checking
                ? (lang === "ar" ? "جاري التحقق…" : "Checking…")
                : <>{dict.booking.next[lang]} <ChevronRight className="h-4 w-4" /></>}
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