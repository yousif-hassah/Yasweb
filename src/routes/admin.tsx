import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/hooks/use-i18n";
import { dict } from "@/lib/translations";
import { formatIQD, openWaLink, SITE, waLink } from "@/lib/site-config";
import { generateSlots } from "@/lib/booking";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import {
  MessageSquare, Users, Megaphone, Image as ImageIcon, Layers,
  CalendarCheck, Package, ShoppingBag, ArrowLeft, Plus, Pencil,
  Trash2, Save, Upload, CheckCircle2, Star,
  Eye, EyeOff, KeyRound, TrendingUp, ChevronLeft, ChevronRight,
} from "lucide-react";

const sb = supabase as any;

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: `Admin — ${SITE.nameEn}` }] }),
  component: Admin,
});

function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setLoading(false); });
  }, [user]);

  if (loading) return <SiteLayout><div className="p-16 text-center text-muted-foreground">…</div></SiteLayout>;
  if (!user) return <SiteLayout><SignIn /></SiteLayout>;
  if (!isAdmin)
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md p-16 text-center">
          <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
          <p className="mt-2 text-destructive">No admin role. Ask the site owner to grant access.</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-6 border border-border px-4 py-2 text-xs uppercase tracking-widest">Sign out</button>
        </div>
      </SiteLayout>
    );

  return <SiteLayout><Dashboard user={user} /></SiteLayout>;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };
  return (
    <div className="mx-auto max-w-md p-16">
      <h1 className="font-display text-3xl uppercase tracking-wider">Admin Sign In</h1>
      <input className="mt-6 w-full border border-border bg-background p-3 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="mt-3 w-full border border-border bg-background p-3 text-sm" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={submit} disabled={busy || !email || !password} className="mt-4 w-full bg-primary py-3 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-30">Sign in</button>
    </div>
  );
}

type Tab = "reviews" | "barbers" | "announcements" | "portfolio" | "services" | "bookings" | "store" | "orders" | "earnings";

const TABS: { id: Tab; en: string; ar: string; Icon: any }[] = [
  { id: "reviews", en: "Reviews", ar: "التقييمات", Icon: MessageSquare },
  { id: "barbers", en: "Barbers", ar: "الحلاقون", Icon: Users },
  { id: "announcements", en: "Announcements", ar: "الإعلانات", Icon: Megaphone },
  { id: "portfolio", en: "Portfolio", ar: "المعرض", Icon: ImageIcon },
  { id: "services", en: "Services", ar: "الخدمات", Icon: Layers },
  { id: "bookings", en: "Bookings", ar: "الحجوزات", Icon: CalendarCheck },
  { id: "store", en: "Store", ar: "المتجر", Icon: Package },
  { id: "orders", en: "Shop Orders", ar: "طلبات المتجر", Icon: ShoppingBag },
  { id: "earnings", en: "Earnings", ar: "الأرباح", Icon: TrendingUp },
];

function Dashboard({ user }: { user: User }) {
  const { lang } = useI18n();
  const [tab, setTab] = useState<Tab>("bookings");
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-start justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> {lang === "ar" ? "الرئيسية" : "Home"}
        </Link>
        <div className="text-end">
          <h1 className="font-display text-4xl md:text-5xl">{lang === "ar" ? "لوحة الإدارة" : "Admin Dashboard"}</h1>
          <div className="mt-2 flex items-center justify-end gap-3 text-xs">
            <span className="text-muted-foreground">{user.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="border border-border px-3 py-1 uppercase tracking-widest">{dict.admin.signOut[lang]}</button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-border pb-1">
        {TABS.map(({ id, en, ar, Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`relative inline-flex items-center gap-2 py-3 text-xs uppercase tracking-widest transition-colors ${tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <span>{lang === "ar" ? ar : en}</span>
            <Icon className="h-4 w-4" />
            {tab === id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "reviews" && <ReviewsTab />}
        {tab === "barbers" && <BarbersTab />}
        {tab === "announcements" && <AnnouncementsTab />}
        {tab === "portfolio" && <PortfolioTab />}
        {tab === "services" && <ServicesTab />}
        {tab === "bookings" && <BookingsTab />}
        {tab === "store" && <StoreTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "earnings" && <EarningsTab />}
      </div>
    </div>
  );
}

/* ============================ REVIEWS ============================ */
function ReviewsTab() {
  const { lang } = useI18n();
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => (await sb.from("reviews").select("*, barbers(name_en)").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div>
      <h2 className="text-end font-display text-2xl">{lang === "ar" ? `تقييمات العملاء · ${data.length}` : `Customer Reviews · ${data.length}`}</h2>
      <p className="mt-1 text-end text-xs text-muted-foreground">{lang === "ar" ? "التقييمات عامة؛ تُجمع التعليقات هنا لمراجعة المدير." : "Ratings are public; comments are collected here for admin review."}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {data.map((r: any) => (
          <div key={r.id} className="rounded-md border border-border bg-card/40 p-5">
            <div className="flex items-start justify-between">
              <div className="text-amber-500">{"★".repeat(r.rating)}<span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span></div>
              <div className="text-end">
                <div className="font-semibold">{r.customer_name}</div>
                <div className="text-xs text-muted-foreground">{r.barbers?.name_en} · {new Date(r.created_at).toLocaleString()}</div>
              </div>
            </div>
            {r.comment && <div className="mt-3 rounded bg-muted/50 p-3 text-end text-sm">{r.comment}</div>}
            <button onClick={async () => { await sb.from("reviews").delete().eq("id", r.id); refetch(); }} className="mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-destructive">
              <Trash2 className="h-3 w-3" /> {dict.admin.delete[lang]}
            </button>
          </div>
        ))}
        {data.length === 0 && <div className="rounded border border-border p-6 text-center text-muted-foreground md:col-span-2">—</div>}
      </div>
    </div>
  );
}

/* ============================ BARBERS ============================ */
function BarbersTab() {
  const { lang } = useI18n();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-barbers"],
    queryFn: async () => (await sb.from("barbers").select("*").order("sort_order")).data ?? [],
  });
  const editing = data.find((b: any) => b.id === editId) ?? null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <button onClick={() => { setAdding(true); setEditId(null); }} className="inline-flex items-center gap-2 bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-background">
          <Plus className="h-3 w-3" /> {lang === "ar" ? "إضافة حلاق" : "Add Barber"}
        </button>
        <h2 className="font-display text-2xl">{lang === "ar" ? `الفريق · ${data.length}` : `Team · ${data.length}`}</h2>
      </div>

      {(adding || editing) && (
        <BarberForm key={editing?.id ?? "new"} initial={editing} onCancel={() => { setAdding(false); setEditId(null); }} onSaved={() => { setAdding(false); setEditId(null); refetch(); }} />
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {data.map((b: any) => (
          <div key={b.id} className="rounded border border-border bg-card/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">{b.photo_url && <img src={b.photo_url} className="h-full w-full object-cover" />}</div>
              <div className="text-end">
                <div className="font-display text-lg">{b.name_en}</div>
                <div className="text-xs text-muted-foreground">{b.role_en ?? "Barber"}{b.years ? ` · ${b.years}y` : ""}</div>
                {b.specialty_en && <div className="text-xs text-muted-foreground">{b.specialty_en}</div>}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={async () => { if (confirm("Delete?")) { await sb.from("barbers").delete().eq("id", b.id); refetch(); } }} className="inline-flex h-9 w-9 items-center justify-center border border-border text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => { setEditId(b.id); setAdding(false); }} className="flex-1 inline-flex items-center justify-center gap-2 border border-border py-2 text-xs uppercase tracking-widest">
                <Pencil className="h-3 w-3" /> {dict.admin.edit[lang]}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarberForm({ initial, onCancel, onSaved }: { initial: any; onCancel: () => void; onSaved: () => void }) {
  const { lang } = useI18n();
  const [f, setF] = useState({
    slug: initial?.slug ?? "",
    years: initial?.years ?? "",
    name_ar: initial?.name_ar ?? "",
    name_en: initial?.name_en ?? "",
    role_ar: initial?.role_ar ?? "",
    role_en: initial?.role_en ?? "",
    specialty_ar: initial?.specialty_ar ?? "",
    specialty_en: initial?.specialty_en ?? "",
    photo_url: initial?.photo_url ?? "",
    email: initial?.email ?? "",
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: upErr } = await sb.storage.from("barbers").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = sb.storage.from("barbers").getPublicUrl(path);
      set("photo_url", pub.publicUrl);
      toast.success("Photo uploaded");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };
  const save = async () => {
    if (!f.name_en || !f.name_ar) return toast.error("Name required");
    // Do NOT write email here when we're (re)provisioning the login —
    // setBarberCredentials updates it inside the same server fn so the
    // auth user and barber row stay in sync.
    const { email: _emailField, ...rest } = f;
    const wantsCredentials = !!f.email && (password.length >= 8 || (initial?.user_id && f.email !== (initial?.email ?? "")));
    const payload: any = {
      ...rest,
      years: f.years ? Number(f.years) : null,
      ...(wantsCredentials ? {} : { email: f.email || null }),
    };
    const { error } = initial
      ? await sb.from("barbers").update(payload).eq("id", initial.id)
      : await sb.from("barbers").insert(payload);
    if (error) return toast.error(error.message);
    // Get the saved barber id (existing edit OR newly inserted row by slug/name)
    let savedBarberId: string | null = initial?.id ?? null;
    if (!savedBarberId) {
      const { data: justSaved } = await sb
        .from("barbers")
        .select("id")
        .eq("name_en", f.name_en)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      savedBarberId = justSaved?.id ?? null;
    }

    if (wantsCredentials && savedBarberId) {
      try {
        const { setBarberCredentials } = await import("@/lib/barber-account.functions");
        await setBarberCredentials({
          data: {
            barberId: savedBarberId,
            email: f.email,
            ...(password ? { password } : {}),
          },
        });
        toast.success(
          lang === "ar"
            ? `تم إعداد حساب الدخول لـ ${f.name_ar}. يمكنه الدخول من /barber`
            : `Login set up for ${f.name_en}. They can sign in at /barber`,
          { duration: 7000 },
        );
      } catch (e: any) {
        toast.error(
          lang === "ar"
            ? `حُفظ الحلاق، لكن تعذّر إعداد حساب الدخول: ${e?.message ?? e}`
            : `Barber saved, but could not set up login: ${e?.message ?? e}`,
        );
        onSaved();
        return;
      }
    }
    toast.success("Saved");
    onSaved();
  };
  return (
    <div className="mt-6 rounded border-2 border-primary/60 bg-primary/5 p-6">
      <div className="text-end font-display text-xl">{initial ? (lang === "ar" ? "تعديل" : "Edit barber") : (lang === "ar" ? "حلاق جديد" : "New barber")}</div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input className="border border-border bg-background p-3 text-sm" placeholder="Years" value={f.years} onChange={(e) => set("years", e.target.value)} />
        <input className="border border-border bg-background p-3 text-sm" placeholder="Slug (unique, e.g. brandon)" value={f.slug} onChange={(e) => set("slug", e.target.value)} />
        <input className="border border-border bg-background p-3 text-sm text-end" placeholder="Name (AR)" value={f.name_ar} onChange={(e) => set("name_ar", e.target.value)} />
        <input className="border border-border bg-background p-3 text-sm" placeholder="Name (EN)" value={f.name_en} onChange={(e) => set("name_en", e.target.value)} />
        <input className="border border-border bg-background p-3 text-sm text-end" placeholder="Role (AR)" value={f.role_ar} onChange={(e) => set("role_ar", e.target.value)} />
        <input className="border border-border bg-background p-3 text-sm" placeholder="Role (EN)" value={f.role_en} onChange={(e) => set("role_en", e.target.value)} />
        <input className="border border-border bg-background p-3 text-sm text-end" placeholder="Specialty (AR)" value={f.specialty_ar} onChange={(e) => set("specialty_ar", e.target.value)} />
        <input className="border border-border bg-background p-3 text-sm" placeholder="Specialty (EN)" value={f.specialty_en} onChange={(e) => set("specialty_en", e.target.value)} />
        <div className="md:col-span-2 mt-2 rounded border border-border/60 bg-muted/20 p-4">
          <div className="text-sm font-semibold">
            {lang === "ar" ? "حساب دخول الحلاق" : "Barber login"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {lang === "ar"
              ? "أعطِ الحلاق بريدًا وكلمة مرور ليدخل على /barber ويرى حجوزات اليوم. اترك كلمة المرور فارغة لإبقاء كلمته الحالية."
              : "Give the barber an email and password to sign in at /barber and see today's bookings. Leave password empty to keep the current one."}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="border border-border bg-background p-3 text-sm"
              type="email"
              placeholder={lang === "ar" ? "البريد الإلكتروني للحلاق" : "Barber email"}
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              autoComplete="off"
            />
            <div className="relative">
              <input
                className="w-full border border-border bg-background p-3 pe-20 text-sm"
                type={showPassword ? "text" : "password"}
                placeholder={
                  initial?.user_id
                    ? lang === "ar" ? "كلمة مرور جديدة (اختياري)" : "New password (optional)"
                    : lang === "ar" ? "كلمة مرور (٨ أحرف فأكثر)" : "Password (min 8 chars)"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
              <div className="absolute inset-y-0 end-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  title={showPassword ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "إظهار" : "Show")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Generate a strong random password and reveal it
                    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
                    let p = "";
                    const arr = new Uint32Array(12);
                    crypto.getRandomValues(arr);
                    for (let i = 0; i < arr.length; i++) p += chars[arr[i] % chars.length];
                    setPassword(p);
                    setShowPassword(true);
                  }}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  title={lang === "ar" ? "توليد كلمة مرور" : "Generate password"}
                >
                  <KeyRound className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {initial?.user_id && (
            <div className="mt-2 text-[11px] text-emerald-600">
              {lang === "ar" ? "حساب الدخول مفعّل." : "Login account is active."}
            </div>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {lang === "ar"
              ? "لأسباب أمنية كلمات المرور مشفّرة ولا يمكن استرجاعها أو عرضها بعد الحفظ — حتى من قبل المدير. إذا نسي الحلاق كلمته، اكتب كلمة مرور جديدة هنا (أو استخدم زر التوليد ↑) واحفظ، ثم أرسلها له. سيستطيع الدخول بها فورًا."
              : "For security, passwords are hashed and cannot be retrieved or shown after saving — not even by an admin. If a barber forgets their password, type a new one here (or click the key icon to generate one) and save, then share it with them. They can sign in immediately with the new password."}
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:bg-muted/40">
            <Upload className="h-4 w-4" />
            <span>{uploading ? "Uploading…" : (f.photo_url ? "Replace photo" : "Upload barber photo")}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadPhoto(file); }} />
          </label>
          {f.photo_url && <img src={f.photo_url} alt="" className="mt-2 h-20 w-20 rounded-full object-cover" />}
        </div>
      </div>
      {initial && <BarberServicePrices barberId={initial.id} />}
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-xs uppercase tracking-widest">{dict.admin.cancel[lang]}</button>
        <button onClick={save} className="inline-flex items-center gap-2 bg-foreground px-5 py-2 text-xs uppercase tracking-widest text-background">
          {dict.admin.save[lang]} <Save className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function BarberServicePrices({ barberId }: { barberId: string }) {
  const { lang } = useI18n();
  const { data: services = [] } = useQuery({
    queryKey: ["bsp-services"],
    queryFn: async () => (await sb.from("services").select("id, name_en, name_ar").order("sort_order")).data ?? [],
  });
  const { data: prices = [], refetch } = useQuery({
    queryKey: ["bsp-prices", barberId],
    queryFn: async () => (await sb.from("barber_services").select("*").eq("barber_id", barberId)).data ?? [],
  });
  const priceOf = (sid: string) => prices.find((p: any) => p.service_id === sid)?.price_iqd ?? "";
  const setPrice = async (sid: string, val: string) => {
    const n = Number(val);
    if (!Number.isFinite(n) || n <= 0) return;
    const existing = prices.find((p: any) => p.service_id === sid);
    if (existing) {
      await sb.from("barber_services").update({ price_iqd: n }).eq("id", existing.id);
    } else {
      await sb.from("barber_services").insert({ barber_id: barberId, service_id: sid, price_iqd: n });
    }
    refetch();
  };
  return (
    <div className="mt-6 rounded border border-border bg-background/60 p-4">
      <div className="text-end text-sm font-semibold">{lang === "ar" ? "أسعار الخدمات لهذا الحلاق" : "Service prices for this barber"}</div>
      <div className="mt-3 space-y-2">
        {services.map((s: any) => (
          <div key={s.id} className="flex items-center gap-3">
            <input
              type="number"
              defaultValue={priceOf(s.id) as any}
              onBlur={(e) => setPrice(s.id, e.target.value)}
              placeholder="IQD"
              className="w-32 border border-border bg-background p-2 text-sm"
            />
            <div className="flex-1 text-end text-sm">
              <span>{s.name_en}</span> · <span className="text-muted-foreground">{s.name_ar}</span>
            </div>
          </div>
        ))}
        {services.length === 0 && <div className="text-end text-xs text-muted-foreground">{lang === "ar" ? "لا توجد خدمات بعد" : "No services yet"}</div>}
      </div>
    </div>
  );
}

/* ============================ ANNOUNCEMENTS ============================ */
function AnnouncementsTab() {
  const { lang } = useI18n();
  const [f, setF] = useState({ message_en: "", message_ar: "", link_url: "" });
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => (await sb.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const publish = async () => {
    if (!f.message_en || !f.message_ar) return toast.error("Both messages required");
    const { error } = await sb.from("announcements").insert({ ...f, link_url: f.link_url || null, active: true });
    if (error) return toast.error(error.message);
    setF({ message_en: "", message_ar: "", link_url: "" });
    refetch();
  };
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded border border-border bg-card/40 p-5">
        <h2 className="text-end font-display text-2xl">{lang === "ar" ? "موجود" : "Existing"}</h2>
        <div className="mt-4 space-y-3">
          {data.length === 0 && <p className="text-end text-sm text-muted-foreground">{lang === "ar" ? "لا توجد إعلانات." : "No announcements."}</p>}
          {data.map((a: any) => (
            <div key={a.id} className="rounded border border-border p-3">
              <div className="text-end text-sm">{a.message_ar}</div>
              <div className="text-sm text-muted-foreground">{a.message_en}</div>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={async () => { await sb.from("announcements").update({ active: !a.active }).eq("id", a.id); refetch(); }} className="border border-border px-2 py-1 text-xs uppercase tracking-widest">{a.active ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "عرض" : "Show")}</button>
                <button onClick={async () => { await sb.from("announcements").delete().eq("id", a.id); refetch(); }} className="text-xs uppercase tracking-widest text-destructive">{dict.admin.delete[lang]}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded border border-border bg-card/40 p-5">
        <h2 className="text-end font-display text-2xl">{lang === "ar" ? "إعلان جديد" : "New Announcement"}</h2>
        <p className="mt-1 text-end text-xs text-muted-foreground">{lang === "ar" ? "يظهر كشريط أعلى كل صفحة. يُعرض الإعلان الأحدث فقط." : "Shown as the banner at the top of every page. Only the most recent active one is displayed."}</p>
        <input className="mt-4 w-full border border-border bg-background p-3 text-sm" placeholder="Message (English)" value={f.message_en} onChange={(e) => setF({ ...f, message_en: e.target.value })} />
        <input className="mt-3 w-full border border-border bg-background p-3 text-sm text-end" placeholder="Message (Arabic)" value={f.message_ar} onChange={(e) => setF({ ...f, message_ar: e.target.value })} />
        <input className="mt-3 w-full border border-border bg-background p-3 text-sm" placeholder="Link URL (optional)" value={f.link_url} onChange={(e) => setF({ ...f, link_url: e.target.value })} />
        <button onClick={publish} className="mt-3 w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background">{lang === "ar" ? "نشر" : "Publish"}</button>
      </div>
    </div>
  );
}

/* ============================ PORTFOLIO ============================ */
function PortfolioTab() {
  const { lang } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-portfolio"],
    queryFn: async () => (await sb.from("portfolio_items").select("*").order("sort_order", { ascending: false })).data ?? [],
  });
  const upload = async () => {
    if (!file) return toast.error("Pick a file");
    setBusy(true);
    try {
      const path = `${Date.now()}-${file.name}`;
      const { error: upErr } = await sb.storage.from("portfolio").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = sb.storage.from("portfolio").getPublicUrl(path);
      const type = file.type.startsWith("video") ? "video" : "image";
      const { error } = await sb.from("portfolio_items").insert({ url: pub.publicUrl, type, title_en: title, title_ar: title });
      if (error) throw error;
      toast.success("Uploaded");
      setFile(null); setTitle(""); refetch();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <div className="rounded border border-border bg-card/40 p-5">
        <h2 className="text-end font-display text-2xl">{lang === "ar" ? "رفع إلى الأعمال" : "Upload to portfolio"}</h2>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-border p-10 text-sm text-muted-foreground hover:bg-muted/40">
          <Upload className="h-6 w-6" />
          <span>{file ? file.name : (lang === "ar" ? "اختر صورة أو فيديو" : "Choose image or video")}</span>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <input className="mt-3 w-full border border-border bg-background p-3 text-sm text-end" placeholder={lang === "ar" ? "وصف (اختياري)" : "Description (optional)"} value={title} onChange={(e) => setTitle(e.target.value)} />
        <button disabled={busy || !file} onClick={upload} className="mt-3 w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background disabled:opacity-30">{lang === "ar" ? "رفع" : "Upload"}</button>
      </div>
      <h3 className="mt-8 text-end font-display text-xl">{lang === "ar" ? `الوسائط الحالية · ${data.length}` : `Current media · ${data.length}`}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.map((p: any) => (
          <div key={p.id} className="group relative overflow-hidden rounded border border-border bg-muted">
            {p.type === "video" ? <video src={p.url} className="aspect-[3/4] w-full object-cover" /> : <img src={p.url} className="aspect-[3/4] w-full object-cover" />}
            {p.title_en && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-xs text-white">{p.title_en}</div>}
            <button onClick={async () => { await sb.from("portfolio_items").delete().eq("id", p.id); refetch(); }} className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded bg-background/80 text-destructive opacity-0 transition group-hover:opacity-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ SERVICES ============================ */
function ServicesTab() {
  const { lang } = useI18n();
  const { data: services = [], refetch: rs } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => (await sb.from("services").select("*").order("sort_order")).data ?? [],
  });
  const [sf, setSf] = useState({ name_ar: "", name_en: "", price: "", duration_minutes: "60" });

  const addService = async () => {
    if (!sf.name_en || !sf.name_ar || !sf.price) return toast.error("Required");
    const { error } = await sb.from("services").insert({
      name_en: sf.name_en, name_ar: sf.name_ar,
      duration_minutes: Number(sf.duration_minutes) || 60,
    });
    if (error) return toast.error(error.message);
    setSf({ name_ar: "", name_en: "", price: "", duration_minutes: "60" });
    rs();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded border border-border bg-card/40 p-5">
        <h2 className="text-end font-display text-2xl">{lang === "ar" ? "الخدمات" : "Services"}</h2>
        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-2">
          {services.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between rounded border border-border p-3">
              <button onClick={async () => { await sb.from("services").update({ active: !s.active }).eq("id", s.id); rs(); }} className="inline-flex items-center gap-1 text-xs uppercase tracking-widest">
                <Trash2 className="h-3 w-3 text-destructive" /> {s.active ? "Hide" : "Show"}
              </button>
              <div className="text-end text-sm">
                <div><span className="font-semibold">{s.name_en}</span> · <span className="text-muted-foreground">{s.name_ar}</span></div>
                <div className="text-xs text-muted-foreground">{s.duration_minutes}min</div>
              </div>
            </div>
          ))}
          {services.length === 0 && <div className="text-end text-sm text-muted-foreground">—</div>}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <input className="border border-border bg-background p-3 text-sm" placeholder="Name (EN)" value={sf.name_en} onChange={(e) => setSf({ ...sf, name_en: e.target.value })} />
          <input className="border border-border bg-background p-3 text-sm text-end" placeholder="Name (AR)" value={sf.name_ar} onChange={(e) => setSf({ ...sf, name_ar: e.target.value })} />
          <input className="border border-border bg-background p-3 text-sm" placeholder="Price" value={sf.price} onChange={(e) => setSf({ ...sf, price: e.target.value })} />
          <input className="border border-border bg-background p-3 text-sm" placeholder="Minutes" value={sf.duration_minutes} onChange={(e) => setSf({ ...sf, duration_minutes: e.target.value })} />
        </div>
        <button onClick={addService} className="mt-3 w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background inline-flex items-center justify-center gap-2">
          {lang === "ar" ? "إضافة خدمة" : "Add Service"} <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ============================ BOOKINGS ============================ */
const BOOKING_STATUSES = ["pending", "confirmed", "paid", "cancelled", "no_show"] as const;
function BookingsTab() {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => (await sb.from("bookings").select("*, customers(*), barbers(*), services(*)").order("starts_at", { ascending: false }).limit(200)).data ?? [],
  });
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.length };
    for (const s of BOOKING_STATUSES) c[s] = data.filter((b: any) => b.status === s).length;
    return c;
  }, [data]);
  // Per-customer stats from the loaded set (by customer_id)
  const customerStats = useMemo(() => {
    const m: Record<string, { total: number; cancelled: number; no_show: number; confirmed: number }> = {};
    for (const b of data as any[]) {
      const k = b.customer_id;
      if (!k) continue;
      const s = (m[k] ??= { total: 0, cancelled: 0, no_show: 0, confirmed: 0 });
      s.total++;
      if (b.status === "cancelled") s.cancelled++;
      if (b.status === "no_show") s.no_show++;
      if (b.status === "confirmed" || b.status === "paid") s.confirmed++;
    }
    return m;
  }, [data]);
  const q = search.trim().toLowerCase();
  const filtered = (data as any[])
    .filter((b) => filter === "all" || b.status === filter)
    .filter((b) => !q || (b.customers?.name ?? "").toLowerCase().includes(q) || (b.customers?.phone ?? "").toLowerCase().includes(q));
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
  const todays = useMemo(
    () => data.filter((b: any) => (b.starts_at ?? "").slice(0, 10) === todayStr)
               .sort((a: any, b: any) => a.starts_at.localeCompare(b.starts_at)),
    [data, todayStr]
  );
  const unconfirmed = useMemo(
    () => (data as any[])
      .filter((b) => b.status === "pending")
      .sort((a, b) => (b.created_at ?? b.starts_at).localeCompare(a.created_at ?? a.starts_at)),
    [data]
  );
  const setStatus = async (id: string, status: string, customerId?: string) => {
    await sb.from("bookings").update({ status }).eq("id", id);
    if (status === "no_show" && customerId) {
      const { data: cust } = await sb.from("customers").select("no_show_count").eq("id", customerId).single();
      await sb.from("customers").update({ no_show_count: (cust?.no_show_count ?? 0) + 1 }).eq("id", customerId);
    }
    qc.invalidateQueries({ queryKey: ["earnings-bookings"] });
    refetch();
  };
  const buildConfirmMsg = (b: any) => {
    const time = new Date(b.starts_at).toLocaleTimeString("ar-IQ", { hour: "numeric", minute: "2-digit", hour12: true });
    const date = new Date(b.starts_at).toLocaleDateString("ar-IQ");
    const barberName = b.barbers?.name_ar ?? b.barbers?.name_en;
    const serviceName = b.services?.name_ar ?? b.services?.name_en;
    return `أهلاً ${b.customers?.name}\n\nنرحب بك في *${SITE.nameAr}*\n\n*تم تأكيد حجزك بنجاح*\n\nالتاريخ: ${date}\nالوقت: ${time}\nالحلاق: ${barberName}\nالخدمة: ${serviceName}\nالسعر: ${formatIQD(b.price_iqd, "ar")}\n\nموقعنا على الخريطة:\n${SITE.mapsUrl}\n\nنراك قريباً!`;
  };
  const confirmAndNotify = async (b: any) => {
    await sb.from("bookings").update({ status: "confirmed" }).eq("id", b.id);
    openWaLink(b.customers?.phone ?? "", buildConfirmMsg(b));
    refetch();
  };
  const deleteBooking = async (id: string) => {
    if (!confirm(lang === "ar" ? "حذف هذا الحجز؟" : "Delete this booking?")) return;
    await sb.from("bookings").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["earnings-bookings"] });
    refetch();
  };
  const saveEdit = async () => {
    if (!editing) return;
    await sb.from("bookings").update({ notes: editing.notes, starts_at: editing.starts_at, ends_at: editing.ends_at }).eq("id", editing.id);
    qc.invalidateQueries({ queryKey: ["earnings-bookings"] });
    setEditing(null);
    refetch();
  };
  const labels: Record<string, { en: string; ar: string }> = {
    all: { en: "All", ar: "الكل" },
    pending: { en: "Pending", ar: "قيد الانتظار" },
    confirmed: { en: "Confirmed", ar: "مؤكد" },
    paid: { en: "Completed", ar: "مكتمل" },
    cancelled: { en: "Cancelled", ar: "ملغى" },
    no_show: { en: "No-show", ar: "لم يحضر" },
  };
  return (
    <div>
      {/* Today's bookings */}
      <div className="mb-6 rounded border border-primary/40 bg-card/40 p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-primary px-3 py-1 text-xs uppercase tracking-widest text-primary-foreground">{todays.length}</span>
          <h3 className="font-display text-xl uppercase tracking-wider">{lang === "ar" ? "حجوزات اليوم" : "Today's Bookings"}</h3>
        </div>
        <div className="mt-3 space-y-2">
          {todays.length === 0 && <div className="text-end text-sm text-muted-foreground">—</div>}
          {todays.map((b: any) => {
            const time = new Date(b.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            const barberName = lang === "ar" ? b.barbers?.name_ar : b.barbers?.name_en;
            const serviceName = lang === "ar" ? b.services?.name_ar : b.services?.name_en;
            const welcomeMsg = `تذكير\n\nأهلاً ${b.customers?.name}\n\nنذكّرك بموعدك اليوم في *${SITE.nameAr}*\n\nالوقت: ${time}\nالحلاق: ${barberName}\nالخدمة: ${serviceName}\n\nموقعنا على الخريطة:\n${SITE.mapsUrl}\n\nنراك قريباً!`;
            return (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-background p-3">
                <a
                  href={waLink(b.customers?.phone ?? "", welcomeMsg)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => { e.preventDefault(); openWaLink(b.customers?.phone ?? "", welcomeMsg); }}
                  className="inline-flex items-center gap-2 bg-primary px-3 py-2 text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
                >
                  {lang === "ar" ? "إرسال ترحيب عبر واتساب" : "Send WhatsApp Welcome"}
                </a>
                <div className="text-end text-sm">
                  <div className="font-semibold">{time} · {b.customers?.name} <span className="text-muted-foreground">({b.customers?.phone})</span></div>
                  <div className="text-xs text-muted-foreground">{barberName} · {serviceName}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New / Unconfirmed bookings */}
      <div className="mb-6 rounded border border-amber-500/50 bg-amber-500/5 p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
            <Star className="h-3 w-3 fill-white" /> {unconfirmed.length}
          </span>
          <h3 className="font-display text-xl uppercase tracking-wider">
            {lang === "ar" ? "حجوزات جديدة (غير مؤكدة)" : "New / Unconfirmed Bookings"}
          </h3>
        </div>
        <div className="mt-3 space-y-2">
          {unconfirmed.length === 0 && (
            <div className="text-end text-sm text-muted-foreground">
              {lang === "ar" ? "لا توجد حجوزات بانتظار التأكيد" : "No bookings awaiting confirmation"}
            </div>
          )}
          {unconfirmed.map((b: any) => {
            const when = new Date(b.starts_at).toLocaleString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, day: "2-digit", month: "2-digit", year: "numeric" });
            const barberName = lang === "ar" ? b.barbers?.name_ar : b.barbers?.name_en;
            const serviceName = lang === "ar" ? b.services?.name_ar : b.services?.name_en;
            return (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-500/40 bg-background p-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <button
                    onClick={() => confirmAndNotify(b)}
                    className="bg-primary px-3 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
                  >
                    {lang === "ar" ? "تأكيد" : "Confirm"}
                  </button>
                  <button
                    onClick={() => deleteBooking(b.id)}
                    className="border border-destructive px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
                  >
                    {lang === "ar" ? "حذف" : "Delete"}
                  </button>
                </div>
                <div className="text-end text-sm">
                  <div className="font-semibold">{when} · {b.customers?.name} <span className="text-muted-foreground">({b.customers?.phone})</span></div>
                  <div className="text-xs text-muted-foreground">{barberName} · {serviceName} · {formatIQD(b.price_iqd)}</div>
                  {b.notes && <div className="mt-0.5 text-xs italic text-muted-foreground">"{b.notes}"</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === "ar" ? "بحث بالاسم أو الرقم" : "Search by name or phone"}
          className="w-full max-w-xs border border-border bg-background px-3 py-1.5 text-sm md:w-64"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {(["cancelled", "paid", "confirmed", "pending", "all"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest ${filter === k ? "border-foreground bg-foreground text-background" : "border-border"}`}>
              {labels[k][lang]} ({counts[k] ?? 0})
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3 text-start">Date</th><th className="p-3 text-start">Customer</th>
              <th className="p-3 text-start">Barber / Service</th><th className="p-3 text-start">Price</th>
              <th className="p-3 text-start">Status</th><th className="p-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b: any) => {
              const st = customerStats[b.customer_id];
              const noShows = (b.customers?.no_show_count ?? 0);
              const isConfirmed = b.status === "confirmed" || b.status === "paid";
              return (
                <tr key={b.id} className={`border-t border-border align-top ${isConfirmed ? "bg-emerald-500/5" : b.status === "pending" ? "bg-amber-500/5" : ""}`}>
                  <td className="p-3 whitespace-nowrap">{new Date(b.starts_at).toLocaleString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {b.status === "pending" && (
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-label="New" />
                      )}
                      <span>{b.customers?.name} <span className="text-muted-foreground">· {b.customers?.phone}</span></span>
                    </div>
                    {st && (
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wider">
                        <span className="rounded bg-card px-1.5 py-0.5">{lang === "ar" ? "حجوزات" : "Bookings"}: {st.total}</span>
                        <span className="rounded bg-card px-1.5 py-0.5 text-destructive">{lang === "ar" ? "ملغاة" : "Cancelled"}: {st.cancelled}</span>
                        <span className="rounded bg-card px-1.5 py-0.5 text-destructive">{lang === "ar" ? "لم يحضر" : "No-show"}: {Math.max(st.no_show, noShows)}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3">{b.barbers?.name_en} · {b.services?.name_en}</td>
                  <td className="p-3 text-primary">{formatIQD(b.price_iqd)}</td>
                  <td className="p-3">
                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-semibold uppercase text-white">
                        <CheckCircle2 className="h-3 w-3" /> {b.status}
                      </span>
                    ) : (
                      <span className="rounded bg-card px-2 py-1 text-xs uppercase">{b.status}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className={`flex flex-wrap gap-1 ${isConfirmed ? "opacity-70" : ""}`}>
                      {isConfirmed ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-600/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> {lang === "ar" ? "تم التأكيد" : "Confirmed"}
                        </span>
                      ) : (
                        <button onClick={() => confirmAndNotify(b)} className="bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">Confirm</button>
                      )}
                      <button onClick={() => setStatus(b.id, "paid")} className="bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700">Done</button>
                      <button onClick={() => setStatus(b.id, "cancelled")} className="bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600">Cancel</button>
                      <button onClick={() => setStatus(b.id, "no_show", b.customer_id)} className="border border-destructive bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20">No-show</button>
                      <button onClick={() => setEditing({ ...b })} className="border border-border px-2 py-1 text-xs hover:bg-card">Edit</button>
                      <button onClick={() => deleteBooking(b.id)} className="border border-destructive px-2 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">—</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && (
        <EditBookingModal
          lang={lang}
          editing={editing}
          setEditing={setEditing}
          onCancel={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}

/* ---- Edit Booking Modal ---- */
function EditBookingModal({
  lang, editing, setEditing, onCancel, onSave,
}: {
  lang: string;
  editing: any;
  setEditing: (v: any) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  // Derive current day string from starts_at
  const currentDay = editing.starts_at
    ? editing.starts_at.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  // Build 30-day strip from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const DAY_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAY_SHORT_AR = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
  const MON_SHORT_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MON_SHORT_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const selectDay = (iso: string) => {
    // Keep the currently selected slot time if any, otherwise reset
    const slots = generateSlots(iso);
    if (slots.length === 0) return;
    const slot = slots[0];
    setEditing({
      ...editing,
      starts_at: slot.startsAt.toISOString(),
      ends_at: slot.endsAt.toISOString(),
    });
  };

  const selectSlot = (slot: { startsAt: Date; endsAt: Date }) => {
    setEditing({
      ...editing,
      starts_at: slot.startsAt.toISOString(),
      ends_at: slot.endsAt.toISOString(),
    });
  };

  const slots = generateSlots(currentDay);
  // If current day is today some past slots may be filtered — show all 12 by generating from a fixed reference
  const allSlots = (() => {
    const [y, m, d] = currentDay.split("-").map(Number);
    const result: { startsAt: Date; endsAt: Date; label: string }[] = [];
    let cursor = new Date(y, m - 1, d, SITE.openingHourLocal, 0, 0, 0);
    const close = new Date(y, m - 1, d, SITE.closingHourLocal, 0, 0, 0);
    while (cursor.getTime() + SITE.slotMinutes * 60_000 <= close.getTime()) {
      const end = new Date(cursor.getTime() + SITE.slotMinutes * 60_000);
      const h = cursor.getHours();
      const min = cursor.getMinutes();
      const period = h >= 12 ? "PM" : "AM";
      const h12 = ((h + 11) % 12) + 1;
      const label = `${h12}:${String(min).padStart(2,"0")} ${period}`;
      result.push({ startsAt: new Date(cursor), endsAt: end, label });
      cursor = new Date(cursor.getTime() + SITE.slotMinutes * 60_000);
    }
    return result;
  })();

  const selectedSlotLabel = editing.starts_at
    ? (() => {
        const h = new Date(editing.starts_at).getHours();
        const min = new Date(editing.starts_at).getMinutes();
        const period = h >= 12 ? "PM" : "AM";
        const h12 = ((h + 11) % 12) + 1;
        return `${h12}:${String(min).padStart(2,"0")} ${period}`;
      })()
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-lg rounded border border-border bg-background p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg uppercase tracking-wider">{lang === "ar" ? "تعديل الحجز" : "Edit Booking"}</h3>

        {/* Day strip */}
        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "اليوم" : "Day"}</p>
        <div className="mt-2 -mx-1 overflow-x-auto">
          <div className="flex gap-2 pb-2 px-1">
            {days.map((d) => {
              const iso = toISO(d);
              const active = iso === currentDay;
              const dayName = (lang === "ar" ? DAY_SHORT_AR : DAY_SHORT_EN)[d.getDay()];
              const monName = (lang === "ar" ? MON_SHORT_AR : MON_SHORT_EN)[d.getMonth()];
              return (
                <button
                  key={iso}
                  onClick={() => selectDay(iso)}
                  className={`flex w-14 flex-none flex-col items-center gap-0.5 rounded-xl border px-2 py-3 transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-foreground"
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-wide ${active ? "opacity-80" : "text-muted-foreground"}`}>{dayName}</span>
                  <span className="font-display text-xl leading-none">{d.getDate()}</span>
                  <span className={`text-[9px] uppercase tracking-wide ${active ? "opacity-80" : "text-muted-foreground"}`}>{monName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot grid */}
        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "الوقت" : "Time"}</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {allSlots.map((s, i) => {
            const active = s.label === selectedSlotLabel;
            return (
              <button
                key={i}
                onClick={() => selectSlot(s)}
                className={`rounded border py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Notes */}
        <label className="mt-4 block text-xs uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "ملاحظات" : "Notes"}</label>
        <textarea
          rows={2}
          value={editing.notes ?? ""}
          onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
          className="mt-1 w-full border border-border bg-background p-2 text-sm"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="border border-border px-4 py-2 text-xs uppercase tracking-widest">{lang === "ar" ? "إلغاء" : "Cancel"}</button>
          <button onClick={onSave} className="bg-primary px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary/90">{lang === "ar" ? "حفظ" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ STORE ============================ */
function StoreTab() {
  const { lang } = useI18n();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { data: products = [], refetch: rp } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await sb.from("products").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: cats = [], refetch: rc } = useQuery({
    queryKey: ["admin-product-cats"],
    queryFn: async () => (await sb.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const editing = products.find((p: any) => p.id === editId) ?? null;
  const [cf, setCf] = useState({ name_en: "", name_ar: "" });

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div>
        <div className="flex items-center justify-between">
          <button onClick={() => { setAdding(true); setEditId(null); }} className="inline-flex items-center gap-2 bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-background">
            <Plus className="h-3 w-3" /> {lang === "ar" ? "إضافة منتج" : "Add Product"}
          </button>
          <h2 className="text-end font-display text-2xl">{lang === "ar" ? `المنتجات · ${products.length}` : `Products · ${products.length}`}</h2>
        </div>
        {(adding || editing) && (
          <ProductForm key={editing?.id ?? "new"} initial={editing} cats={cats} onCancel={() => { setAdding(false); setEditId(null); }} onSaved={() => { setAdding(false); setEditId(null); rp(); }} />
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {products.map((p: any) => (
            <div key={p.id} className="rounded border border-border bg-card/40 p-4">
              <div className="flex items-start gap-3">
                <div className="h-20 w-20 flex-none overflow-hidden rounded bg-muted">
                  {p.image_url && <img src={p.image_url} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 text-end">
                  <div className="font-display">{p.name_en}</div>
                  <div className="text-xs text-muted-foreground">{p.name_ar}</div>
                  <div className="mt-1 text-sm">IQD {p.price_iqd}</div>
                  <div className={`text-xs ${p.stock > 0 ? "text-emerald-600" : "text-destructive"}`}>{p.stock > 0 ? `Stock: ${p.stock}` : "SOLD OUT"}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={async () => { if (confirm("Delete?")) { await sb.from("products").delete().eq("id", p.id); rp(); } }} className="inline-flex h-9 w-9 items-center justify-center border border-border text-destructive"><Trash2 className="h-4 w-4" /></button>
                <button onClick={async () => { await sb.from("products").update({ active: !p.active }).eq("id", p.id); rp(); }} className="flex-none border border-border px-3 text-xs uppercase tracking-widest">{p.active ? "Hide" : "Show"}</button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/shop?p=${p.id}`;
                    navigator.clipboard.writeText(url).then(() => toast.success("Link copied!"));
                  }}
                  className="flex-none border border-border px-3 text-xs uppercase tracking-widest text-primary"
                  title="Copy shareable product link"
                >
                  🔗 Link
                </button>
                <button onClick={() => { setEditId(p.id); setAdding(false); }} className="flex-1 inline-flex items-center justify-center gap-1 border border-border py-2 text-xs uppercase tracking-widest"><Pencil className="h-3 w-3" /> Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border border-border bg-card/40 p-5 h-fit">
        <h3 className="text-end font-display text-xl">{lang === "ar" ? "تصنيفات المتجر" : "Store Categories"}</h3>
        <div className="mt-4 space-y-2">
          {cats.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between rounded border border-border p-3">
              <button
                onClick={async () => {
                  const hasProducts = products.some((p: any) => p.category_id === c.id);
                  if (hasProducts) {
                    toast.error(
                      lang === "ar"
                        ? "لا يمكن حذف هذا التصنيف لأنه يحتوي على منتجات. يجب حذف المنتجات أولاً."
                        : "Cannot delete this category because it contains products. You must delete the products first."
                    );
                    return;
                  }
                  if (confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا التصنيف؟" : "Are you sure you want to delete this category?")) {
                    const { error } = await sb.from("categories").delete().eq("id", c.id);
                    if (error) {
                      toast.error(error.message);
                    } else {
                      toast.success(lang === "ar" ? "تم حذف التصنيف بنجاح" : "Category deleted successfully");
                      rc();
                    }
                  }
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="text-end">
                <div className="font-semibold">{c.name_en}</div>
                <div className="text-xs text-muted-foreground">{c.name_ar}</div>
              </div>
            </div>
          ))}
        </div>
        <input className="mt-3 w-full border border-border bg-background p-3 text-sm" placeholder="Category (EN)" value={cf.name_en} onChange={(e) => setCf({ ...cf, name_en: e.target.value })} />
        <input className="mt-2 w-full border border-border bg-background p-3 text-sm text-end" placeholder="Category (AR)" value={cf.name_ar} onChange={(e) => setCf({ ...cf, name_ar: e.target.value })} />
        <button onClick={async () => { if (!cf.name_en || !cf.name_ar) return; const { error } = await sb.from("categories").insert(cf); if (error) return toast.error(error.message); setCf({ name_en: "", name_ar: "" }); rc(); }} className="mt-3 w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background inline-flex items-center justify-center gap-2">
          {lang === "ar" ? "إضافة تصنيف" : "Add Category"} <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ProductForm({ initial, cats, onCancel, onSaved }: { initial: any; cats: any[]; onCancel: () => void; onSaved: () => void }) {
  const { lang } = useI18n();
  const [f, setF] = useState({
    name_en: initial?.name_en ?? "",
    name_ar: initial?.name_ar ?? "",
    description_en: initial?.description_en ?? "",
    description_ar: initial?.description_ar ?? "",
    price_iqd: initial?.price_iqd ?? "",
    category_id: initial?.category_id ?? "",
    image_url: initial?.image_url ?? "",
    colors: (initial?.colors ?? []).join(", "),
    sizes: (initial?.sizes ?? []).join(", "),
    stock: initial?.stock ?? 0,
  });
  const [uploading, setUploading] = useState(false);
  const colorList: string[] = f.colors.split(",").map((s: string) => s.trim()).filter(Boolean);
  const sizeList: string[] = f.sizes.split(",").map((s: string) => s.trim()).filter(Boolean);

  // variants: map of "color|size" -> stock
  const [variantStock, setVariantStock] = useState<Record<string, number>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!initial?.id) { setVariantStock({}); return; }
      const { data } = await sb.from("product_variants").select("*").eq("product_id", initial.id);
      if (cancelled) return;
      const m: Record<string, number> = {};
      (data ?? []).forEach((v: any) => { m[`${v.color ?? ""}|${v.size ?? ""}`] = v.stock ?? 0; });
      setVariantStock(m);
    })();
    return () => { cancelled = true; };
  }, [initial?.id]);

  const combos: { color: string; size: string }[] = (() => {
    if (colorList.length === 0 && sizeList.length === 0) return [];
    if (colorList.length === 0) return sizeList.map((s: string) => ({ color: "", size: s }));
    if (sizeList.length === 0) return colorList.map((c: string) => ({ color: c, size: "" }));
    return colorList.flatMap((c: string) => sizeList.map((s: string) => ({ color: c, size: s })));
  })();
  const totalStock = combos.reduce((sum, k) => sum + (Number(variantStock[`${k.color}|${k.size}`]) || 0), 0);

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      // Use timestamp + extension only — avoids Supabase rejecting non-ASCII
      // characters (em dashes, Arabic, etc.) in the storage path.
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "jpg";
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage.from("products").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = sb.storage.from("products").getPublicUrl(path);
      set("image_url", pub.publicUrl);
      toast.success("Image uploaded");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };
  const save = async () => {
    if (!f.name_en || !f.price_iqd) {
      toast.error(!f.name_en ? "Product name (EN) is required" : "Price is required");
      return;
    }
    const productStock = combos.length > 0 ? totalStock : Number(f.stock) || 0;
    const payload: any = {
      name_en: f.name_en, name_ar: f.name_ar || f.name_en,
      description_en: f.description_en || null, description_ar: f.description_ar || null,
      price_iqd: Number(f.price_iqd), stock: productStock,
      category_id: f.category_id || null, image_url: f.image_url || null,
      colors: f.colors ? f.colors.split(",").map((s: string) => s.trim()).filter(Boolean) : null,
      sizes: f.sizes ? f.sizes.split(",").map((s: string) => s.trim()).filter(Boolean) : null,
    };
    let productId = initial?.id as string | undefined;
    if (initial) {
      const { error } = await sb.from("products").update(payload).eq("id", initial.id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await sb.from("products").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      productId = (data as any)?.id;
    }
    // Fetch existing variants first so we can surgically remove orphans
    const { data: existingVars } = await sb
      .from("product_variants")
      .select("id, color, size")
      .eq("product_id", productId);

    if (combos.length > 0) {
      const comboKeys = new Set(combos.map((k) => `${k.color ?? ""}|${k.size ?? ""}`));

      // Delete variants whose color/size combo no longer exists
      const orphans = (existingVars ?? []).filter(
        (v: any) => !comboKeys.has(`${v.color ?? ""}|${v.size ?? ""}`)
      );
      for (const v of orphans) {
        await sb.from("product_variants").delete().eq("id", v.id);
      }

      // Upsert current combos — never fails on duplicates
      const rows = combos.map((k) => ({
        product_id: productId,
        color: k.color || null,
        size: k.size || null,
        stock: Number(variantStock[`${k.color}|${k.size}`]) || 0,
      }));
      const { error: vErr } = await sb
        .from("product_variants")
        .upsert(rows, { onConflict: "product_id,color,size" });
      if (vErr) return toast.error(vErr.message);
    } else {
      // No combos → wipe all variants
      await sb.from("product_variants").delete().eq("product_id", productId);
    }

    toast.success("Saved");
    onSaved();
  };
  return (
    <div className="mt-4 rounded border-2 border-primary/60 bg-primary/5 p-5">
      <div className="grid gap-2 md:grid-cols-2">
        <input className="border border-border bg-background p-2 text-sm md:col-span-2" placeholder="Price (IQD)" value={f.price_iqd} onChange={(e) => set("price_iqd", e.target.value)} />
        {/* Stock for products with no color/size variants */}
        {combos.length === 0 && (
          <input
            className="border border-border bg-background p-2 text-sm md:col-span-2"
            type="number"
            min={0}
            placeholder="Stock quantity (leave 0 if tracked by variants)"
            value={f.stock}
            onChange={(e) => set("stock", e.target.value)}
          />
        )}
        <select className="border border-border bg-background p-2 text-sm md:col-span-2" value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
          <option value="">— No category —</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name_en} / {c.name_ar}</option>)}
        </select>
        <div className="md:col-span-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:bg-muted/40">
            <Upload className="h-4 w-4" />
            <span>{uploading ? "Uploading…" : (f.image_url ? "Replace product image" : "Upload product image")}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(file); }} />
          </label>
          {f.image_url && <img src={f.image_url} alt="" className="mt-2 h-24 w-24 rounded object-cover" />}
        </div>
        <input className="border border-border bg-background p-2 text-sm" placeholder="Colors — optional (e.g. Black, White)" value={f.colors} onChange={(e) => set("colors", e.target.value)} />
        <input className="border border-border bg-background p-2 text-sm" placeholder="Sizes — optional (e.g. S, M, L)" value={f.sizes} onChange={(e) => set("sizes", e.target.value)} />
        <input className="border border-border bg-background p-2 text-sm text-end" placeholder="Name (AR) — optional" value={f.name_ar} onChange={(e) => set("name_ar", e.target.value)} />
        <input className="border border-border bg-background p-2 text-sm" placeholder="Name (EN) *required" value={f.name_en} onChange={(e) => set("name_en", e.target.value)} />
        <textarea className="md:col-span-2 border border-border bg-background p-2 text-sm" rows={2} placeholder="Description (EN)" value={f.description_en} onChange={(e) => set("description_en", e.target.value)} />
        <textarea className="md:col-span-2 border border-border bg-background p-2 text-sm text-end" rows={2} placeholder="Description (AR)" value={f.description_ar} onChange={(e) => set("description_ar", e.target.value)} />
      </div>
      {combos.length > 0 && (
        <div className="mt-4 rounded border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
            <span>Total: {totalStock}</span>
            <span>{lang === "ar" ? "المخزون لكل لون/مقاس" : "Stock per color / size"}</span>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `minmax(80px, 1fr) repeat(${Math.max(1, sizeList.length || 1)}, minmax(60px, 1fr))` }}>
            {sizeList.length > 0 && (
              <>
                <div />
                {sizeList.map((s: string) => <div key={s} className="text-center text-xs font-semibold">{s}</div>)}
              </>
            )}
            {(colorList.length > 0 ? colorList : [""]).map((c: string) => (
              <Fragment key={`row-${c}`}>
                <div key={`lbl-${c}`} className="text-end text-xs font-semibold self-center">{c || "—"}</div>
                {(sizeList.length > 0 ? sizeList : [""]).map((s: string) => {
                  const key = `${c}|${s}`;
                  return (
                    <input
                      key={key}
                      type="number"
                      min={0}
                      className="border border-border bg-background p-2 text-center text-sm"
                      value={variantStock[key] ?? 0}
                      onChange={(e) => setVariantStock((p) => ({ ...p, [key]: Number(e.target.value) || 0 }))}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-xs uppercase tracking-widest">{dict.admin.cancel[lang]}</button>
        <button onClick={save} className="inline-flex items-center gap-2 bg-foreground px-5 py-2 text-xs uppercase tracking-widest text-background">{dict.admin.save[lang]} <Save className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

/* ============================ ORDERS ============================ */
const ORDER_STATUSES = ["pending", "confirmed", "ready", "completed", "cancelled"] as const;
function OrdersTab() {
  const { lang } = useI18n();
  const [filter, setFilter] = useState<string>("all");
  const [waSent, setWaSent] = useState<Set<string>>(new Set());
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.length };
    for (const s of ORDER_STATUSES) c[s] = data.filter((o: any) => o.status === s).length;
    return c;
  }, [data]);
  const filtered = filter === "all" ? data : data.filter((o: any) => o.status === filter);
  const setStatus = async (id: string, status: string) => { await sb.from("orders").update({ status }).eq("id", id); refetch(); };
  const deleteOrder = async (id: string) => {
    if (!confirm(lang === "ar" ? "هل تريد حذف هذا الطلب نهائياً؟" : "Delete this order permanently?")) return;
    await sb.from("order_items").delete().eq("order_id", id);
    await sb.from("orders").delete().eq("id", id);
    refetch();
  };

  /** Build a full-detail WhatsApp confirmation message (Arabic) */
  const buildWaMessage = (o: any) => {
    const lines: string[] = [];
    lines.push(`أهلاً ${o.customer_name}`);
    lines.push("");
    lines.push(`*تم تأكيد طلبك في ${SITE.nameAr}*`);
    lines.push("");
    lines.push(`الهاتف: ${o.customer_phone}`);
    lines.push(`العنوان: ${o.customer_address} — ${o.governorate}`);
    lines.push("");
    lines.push("*تفاصيل الطلب:*");
    (o.order_items ?? []).forEach((it: any) => {
      const variant = [it.color, it.size].filter(Boolean).join(" / ");
      lines.push(`- ${it.product_name}${variant ? ` (${variant})` : ""} x ${it.quantity} — ${formatIQD(it.price_iqd * it.quantity, "ar")}`);
    });
    lines.push("");
    lines.push(`*الإجمالي: ${formatIQD(o.total_iqd, "ar")}*`);
    if (o.notes) lines.push(`ملاحظات: ${o.notes}`);
    lines.push("");
    lines.push("سنتواصل معك قريباً للتوصيل. شكراً لثقتك بنا!");
    return lines.join("\n");
  };

  /** Send WhatsApp → auto-confirm pending order → mark green */
  const sendWhatsApp = async (o: any) => {
    openWaLink(o.customer_phone, buildWaMessage(o));
    if (o.status === "pending") await setStatus(o.id, "confirmed");
    setWaSent((prev) => new Set([...prev, o.id]));
  };

  const labels: Record<string, { en: string; ar: string }> = {
    all: { en: "All", ar: "الكل" },
    pending: { en: "Pending", ar: "قيد الانتظار" },
    confirmed: { en: "Confirmed", ar: "مؤكد" },
    ready: { en: "Ready", ar: "جاهز" },
    completed: { en: "Completed", ar: "مكتمل" },
    cancelled: { en: "Cancelled", ar: "ملغى" },
  };
  const statusColor: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    confirmed: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    ready: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    completed: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {(["cancelled", "completed", "ready", "confirmed", "pending", "all"] as const).map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest ${filter === k ? "border-foreground bg-foreground text-background" : "border-border"}`}>
            {labels[k][lang]} ({counts[k] ?? 0})
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {filtered.map((o: any) => {
          const isNew = o.status === "pending";
          const waConfirmed = waSent.has(o.id);
          return (
            <div key={o.id} className={`rounded border p-4 transition-colors ${isNew ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-card/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {isNew && <Star className="h-4 w-4 fill-amber-400 text-amber-400 flex-none" />}
                  <div>
                    {new Date(o.created_at).toLocaleString()}<br />
                    {o.customer_address} · {o.governorate}
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-semibold">{o.customer_name} <span className="text-muted-foreground">· {o.customer_phone}</span></div>
                  <div className="font-display text-primary">{formatIQD(o.total_iqd, lang)}</div>
                  <span className={`mt-1 inline-block rounded border px-2 py-0.5 text-[10px] uppercase tracking-widest ${statusColor[o.status] ?? "border-border"}`}>
                    {labels[o.status]?.[lang] ?? o.status}
                  </span>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {o.order_items?.map((it: any) => {
                  const variant = [it.color, it.size].filter(Boolean).join(" / ");
                  return (
                    <li key={it.id}>
                      · {it.product_name}{variant ? ` (${variant})` : ""} × {it.quantity} — {formatIQD(it.price_iqd * it.quantity, lang)}
                    </li>
                  );
                })}
              </ul>
              {o.notes && <div className="mt-2 text-xs text-muted-foreground">📝 {o.notes}</div>}
              <div className="mt-3 flex flex-wrap gap-1">
                {ORDER_STATUSES.filter((s) => s !== o.status).map((s) => (
                  <button key={s} onClick={() => setStatus(o.id, s)} className="border border-border px-2 py-1 text-xs uppercase tracking-widest hover:bg-card">
                    {labels[s][lang]}
                  </button>
                ))}
                <button
                  onClick={() => sendWhatsApp(o)}
                  className={`inline-flex items-center gap-1.5 border px-3 py-1 text-xs uppercase tracking-widest transition-colors ${
                    waConfirmed
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-primary text-primary hover:bg-primary/5"
                  }`}
                >
                  {waConfirmed && <CheckCircle2 className="h-3.5 w-3.5" />}
                  WhatsApp{waConfirmed ? (lang === "ar" ? " · تم الإرسال" : " · Sent") : ""}
                </button>
                <button onClick={() => deleteOrder(o.id)} className="inline-flex items-center gap-1 border border-destructive px-3 py-1 text-xs uppercase tracking-widest text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3" /> {dict.admin.delete[lang]}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="rounded border border-border p-6 text-center text-muted-foreground">—</div>}
      </div>
    </div>
  );
}


/* ============================ EARNINGS ============================ */
function EarningsTab() {
  const { lang } = useI18n();

  // Month navigation state — default to current month
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  // Fetch all paid bookings (done)
  const { data: paidBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["earnings-bookings"],
    queryFn: async () =>
      (await sb
        .from("bookings")
        .select("id, starts_at, price_iqd, status, customers(name, phone), barbers(name_en, name_ar), services(name_en, name_ar)")
        .eq("status", "paid")
        .order("starts_at", { ascending: false })
      ).data ?? [],
  });

  // Fetch all completed orders
  const { data: completedOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["earnings-orders"],
    queryFn: async () =>
      (await sb
        .from("orders")
        .select("id, created_at, total_iqd, customer_name, customer_phone, order_items(*)")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
      ).data ?? [],
  });

  // Month navigation helpers
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const monthLabel = new Date(year, month, 1).toLocaleDateString(
    lang === "ar" ? "ar-IQ" : "en-GB",
    { month: "long", year: "numeric" }
  );

  // Filter to selected month
  const inMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() === month;
  };

  const monthBookings = (paidBookings as any[]).filter((b) => inMonth(b.starts_at));
  const monthOrders  = (completedOrders as any[]).filter((o) => inMonth(o.created_at));

  const bookingTotal = monthBookings.reduce((s: number, b: any) => s + (b.price_iqd ?? 0), 0);
  const orderTotal   = monthOrders.reduce((s: number, o: any) => s + (o.total_iqd ?? 0), 0);
  const grandTotal   = bookingTotal + orderTotal;

  const isLoading = loadingBookings || loadingOrders;

  return (
    <div>
      {/* Header + month navigator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-card"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[160px] text-center text-sm font-semibold uppercase tracking-widest">
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            disabled={year === now.getFullYear() && month === now.getMonth()}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-card disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h2 className="font-display text-2xl">
          {lang === "ar" ? "الأرباح الشهرية" : "Monthly Earnings"}
        </h2>
      </div>

      {isLoading ? (
        <div className="mt-12 text-center text-muted-foreground">…</div>
      ) : (
        <>
          {/* Grand total card */}
          <div className="mt-6 rounded-lg border border-primary/40 bg-primary/5 p-6 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {lang === "ar" ? "إجمالي الشهر" : "Total This Month"}
            </div>
            <div className="mt-2 font-display text-4xl text-primary">
              {formatIQD(grandTotal, lang)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {lang === "ar"
                ? `${monthBookings.length} حجز مكتمل · ${monthOrders.length} طلب مكتمل`
                : `${monthBookings.length} completed bookings · ${monthOrders.length} completed orders`}
            </div>
          </div>

          {/* Two sub-sections */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {/* ── Reservations ── */}
            <div className="rounded border border-border bg-card/40">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="text-end">
                  <div className="font-display text-xl">
                    {lang === "ar" ? "الحجوزات" : "Reservations"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {lang === "ar" ? "الحجوزات المكتملة (تم)" : "Bookings marked Done"}
                  </div>
                </div>
                <CalendarCheck className="h-8 w-8 text-primary/50" />
              </div>
              <div className="px-5 py-4">
                <div className="text-2xl font-semibold text-primary">{formatIQD(bookingTotal, lang)}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {lang === "ar" ? `${monthBookings.length} حجز` : `${monthBookings.length} booking${monthBookings.length !== 1 ? "s" : ""}`}
                </div>
              </div>
              {/* Booking rows */}
              <div className="divide-y divide-border border-t border-border">
                {monthBookings.length === 0 && (
                  <div className="px-5 py-4 text-center text-sm text-muted-foreground">—</div>
                )}
                {monthBookings.map((b: any) => {
                  const barberName = lang === "ar" ? b.barbers?.name_ar : b.barbers?.name_en;
                  const serviceName = lang === "ar" ? b.services?.name_ar : b.services?.name_en;
                  return (
                    <div key={b.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="font-medium text-primary">{formatIQD(b.price_iqd, lang)}</span>
                      <div className="text-end">
                        <div className="font-medium">{b.customers?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {barberName} · {serviceName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(b.starts_at).toLocaleDateString(lang === "ar" ? "ar-IQ" : "en-GB")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Store Orders ── */}
            <div className="rounded border border-border bg-card/40">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="text-end">
                  <div className="font-display text-xl">
                    {lang === "ar" ? "طلبات المتجر" : "Store Orders"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {lang === "ar" ? "الطلبات المكتملة" : "Orders marked Completed"}
                  </div>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary/50" />
              </div>
              <div className="px-5 py-4">
                <div className="text-2xl font-semibold text-primary">{formatIQD(orderTotal, lang)}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {lang === "ar" ? `${monthOrders.length} طلب` : `${monthOrders.length} order${monthOrders.length !== 1 ? "s" : ""}`}
                </div>
              </div>
              {/* Order rows */}
              <div className="divide-y divide-border border-t border-border">
                {monthOrders.length === 0 && (
                  <div className="px-5 py-4 text-center text-sm text-muted-foreground">—</div>
                )}
                {monthOrders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-primary">{formatIQD(o.total_iqd, lang)}</span>
                    <div className="text-end">
                      <div className="font-medium">{o.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(o.order_items ?? []).length} {lang === "ar" ? "منتج" : "item(s)"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString(lang === "ar" ? "ar-IQ" : "en-GB")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
