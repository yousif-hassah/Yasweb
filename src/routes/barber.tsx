import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyBarberDay } from "@/lib/barber-account.functions";
import { SITE } from "@/lib/site-config";
import { useI18n } from "@/hooks/use-i18n";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { LogOut, Calendar, Phone, User as UserIcon, Trophy, X, Download } from "lucide-react";
import { formatIQD } from "@/lib/site-config";

export const Route = createFileRoute("/barber")({
  head: () => ({
    meta: [
      { title: `Barber Portal — ${SITE.nameEn}` },
      { name: "robots", content: "noindex,nofollow" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "YAS Barber" },
    ],
    links: [
      { rel: "manifest", href: "/barber-manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/yasicon.jpg" },
    ],
  }),
  component: BarberPortal,
});

/* ────────────────── PWA Install Hook ────────────────── */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running as standalone (installed)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Detect if app was installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt]);

  return { canInstall: !!deferredPrompt && !isInstalled, isInstalled, install };
}

/* ────────────────── Service Worker & Manifest Override ────────────────── */
function useBarberPWA() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Override the root manifest with the barber-scoped one
    const existingManifest = document.querySelector('link[rel="manifest"]');
    if (existingManifest) {
      existingManifest.setAttribute("href", "/barber-manifest.webmanifest");
    } else {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/barber-manifest.webmanifest";
      document.head.appendChild(link);
    }

    // Register barber service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/barber-sw.js", { scope: "/barber" })
        .then((reg) => {
          console.log("[Barber SW] registered", reg.scope);
        })
        .catch((err) => {
          console.warn("[Barber SW] registration failed", err);
        });
    }

    // Restore original manifest on unmount (navigating away)
    return () => {
      const manifest = document.querySelector('link[rel="manifest"]');
      if (manifest) {
        manifest.setAttribute("href", "/manifest.webmanifest");
      }
    };
  }, []);
}

function BarberPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Register service worker & set barber manifest for PWA
  useBarberPWA();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <Shell><div className="p-16 text-center text-muted-foreground">…</div></Shell>;
  }
  if (!user) return <Shell><BarberSignIn /></Shell>;
  return <Shell><BarberDashboard user={user} /></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <div className="font-display text-xl tracking-wide">{SITE.nameEn}</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Barber Portal</div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}

function BarberSignIn() {
  const { lang } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl uppercase tracking-wider">
        {lang === "ar" ? "دخول الحلاق" : "Barber Sign In"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {lang === "ar"
          ? "أدخل بريدك وكلمة المرور لرؤية حجوزات اليوم."
          : "Enter your email and password to see today's bookings."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          className="w-full border border-border bg-background p-3 text-sm"
          type="email"
          placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          className="w-full border border-border bg-background p-3 text-sm"
          type="password"
          placeholder={lang === "ar" ? "كلمة المرور" : "Password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button
          disabled={busy || !email || !password}
          className="w-full bg-primary py-3 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-30"
        >
          {busy ? "…" : lang === "ar" ? "دخول" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

const STORAGE_KEY = "yas_ended_sessions";

function getStoredEnded(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function addStoredEnded(id: string) {
  try {
    const existing = getStoredEnded();
    existing.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing]));
  } catch { /* ignore */ }
}

function BarberDashboard({ user }: { user: User }) {
  const [endedSession, setEndedSession] = useState<any | null>(null);
  const [doneSessions, setDoneSessions] = useState<Set<string>>(() => getStoredEnded());
  const { lang } = useI18n();
  const qc = useQueryClient();
  const fetchDay = useServerFn(getMyBarberDay);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-barber-day", user.id],
    queryFn: () => fetchDay(),
  });
  const { canInstall, isInstalled, install } = usePWAInstall();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
  };

  if (isLoading) return <div className="text-center text-muted-foreground">…</div>;

  if (error) {
    return (
      <div className="rounded border border-destructive/40 bg-destructive/10 p-6 text-sm">
        <div className="font-medium text-destructive">
          {lang === "ar" ? "تعذّر تحميل الحجوزات" : "Could not load bookings"}
        </div>
        <div className="mt-1 text-muted-foreground">{(error as Error).message}</div>
        <button onClick={() => refetch()} className="mt-3 border border-border px-4 py-2 text-xs uppercase tracking-widest">
          {lang === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  if (!data?.barber) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm text-muted-foreground">{lang === "ar" ? "متصل بـ" : "Signed in as"} {user.email}</p>
        <p className="mt-2 text-destructive">
          {lang === "ar"
            ? "هذا الحساب غير مربوط بأي حلاق. تواصل مع الإدارة."
            : "This account is not linked to a barber. Contact the admin."}
        </p>
        <button onClick={signOut} className="mt-6 inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest">
          <LogOut className="h-3 w-3" /> {lang === "ar" ? "خروج" : "Sign out"}
        </button>
      </div>
    );
  }

  const name = lang === "ar" ? data.barber.name_ar : data.barber.name_en;
  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-IQ" : "en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Baghdad",
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{name}</h1>
          <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" /> {today}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          {canInstall && (
            <button
              onClick={async () => {
                const accepted = await install();
                if (accepted) {
                  toast.success(lang === "ar" ? "تم تثبيت التطبيق!" : "App installed!");
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-xs uppercase tracking-widest text-primary transition-all hover:bg-primary/20 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              {lang === "ar" ? "تثبيت التطبيق" : "Install App"}
            </button>
          )}
          {isInstalled && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-emerald-600 border border-emerald-500/30">
              {lang === "ar" ? "مثبّت ✓" : "Installed ✓"}
            </span>
          )}
          <button onClick={signOut} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest">
            <LogOut className="h-3 w-3" /> {lang === "ar" ? "خروج" : "Sign out"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl">
            {lang === "ar" ? "حجوزات اليوم" : "Today's bookings"}
          </h2>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {data.bookings.length} {lang === "ar" ? "حجز" : "total"}
          </span>
        </div>

        {data.bookings.length === 0 ? (
          <div className="mt-6 rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {lang === "ar" ? "لا توجد حجوزات اليوم." : "No bookings today."}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded border border-border bg-card/30">
            {data.bookings.map((b: any) => {
              const t = new Date(b.starts_at).toLocaleTimeString("en-US", {
                hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Baghdad",
              });
              const svc = lang === "ar" ? b.services?.name_ar : b.services?.name_en;
              const isPending = b.status === "pending";
              return (
                <li key={b.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="w-16 text-2xl font-display tabular-nums">{t}</div>
                  <div className="flex-1 min-w-[12rem]">
                    <div className="flex items-center gap-2 font-medium">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      {isPending
                        ? <span className="italic text-muted-foreground">{lang === "ar" ? "يظهر بعد التأكيد" : "Visible after confirmation"}</span>
                        : (b.customers?.name ?? "—")}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {isPending ? (
                        <>
                          <span>{svc}</span>
                          <span>·</span>
                          <span className="italic">{lang === "ar" ? "رقم الزبون مخفي حتى التأكيد" : "Phone hidden until confirmed"}</span>
                        </>
                      ) : (
                        <>
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${b.customers?.phone ?? ""}`} className="hover:underline">
                            {b.customers?.phone ?? "—"}
                          </a>
                          <span>·</span>
                          <span>{svc}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-[10px] uppercase tracking-widest " +
                      (isPending
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30")
                    }
                  >
                    {isPending
                      ? lang === "ar" ? "بانتظار التأكيد" : "Pending"
                      : lang === "ar" ? "مؤكد" : "Confirmed"}
                  </span>
                  {/* End Session button — only for confirmed bookings; dark badge once ended */}
                  {!isPending && (
                    doneSessions.has(b.id) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
                        <Trophy className="h-3.5 w-3.5" />
                        OK ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => setEndedSession(b)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground hover:bg-primary/85 active:scale-95 transition-transform"
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        {lang === "ar" ? "إنهاء الجلسة" : "End Session"}
                      </button>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* End Session modal */}
      {endedSession && (
        <EndSessionModal
          booking={endedSession}
          lang={lang}
          onClose={() => {
            // Cosmetic only — localStorage persistence, admin controls DB earnings
            addStoredEnded(endedSession.id);
            setDoneSessions((prev) => new Set([...prev, endedSession.id]));
            setEndedSession(null);
          }}
        />
      )}
    </div>
  );
}

function EndSessionModal({ booking, lang, onClose }: { booking: any; lang: string; onClose: () => void }) {
  const customerName = booking.customers?.name ?? (lang === "ar" ? "العميل" : "Customer");
  const svc = lang === "ar" ? booking.services?.name_ar : booking.services?.name_en;
  const price = booking.price_iqd ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Trophy icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
          <Trophy className="h-10 w-10 text-primary" />
        </div>

        {/* Title */}
        <h2 className="mt-5 font-display text-3xl tracking-wide">
          {lang === "ar" ? "أحسنت! 🎉" : "Well Done! 🎉"}
        </h2>

        {/* Subtitle */}
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "ar"
            ? `انتهت جلسة ${customerName} بنجاح`
            : `Session with ${customerName} completed`}
        </p>

        {/* Service */}
        {svc && (
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{svc}</p>
        )}

        {/* Price */}
        <div className="mt-6 rounded-xl bg-primary/5 py-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {lang === "ar" ? "سعر الجلسة" : "Session Price"}
          </div>
          <div className="mt-1 font-display text-4xl text-primary">
            {formatIQD(price, lang as any)}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
        >
          {lang === "ar" ? "حسنًا ✓" : "Got it ✓"}
        </button>
      </div>
    </div>
  );
}