import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/hooks/use-i18n";
import { useCart } from "@/hooks/use-cart";
import { dict } from "@/lib/translations";
import { formatIQD, SITE, normalizePhoneDigits } from "@/lib/site-config";
import { IRAQI_GOVERNORATES } from "@/lib/governorates";
import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: `Cart | عربة التسوق — ${SITE.nameEn}` }] }),
  component: Cart,
});

function Cart() {
  const { lang } = useI18n();
  const { items, remove, setQty, total, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!name || !phone || !governorate || !address || items.length === 0) return;
    setSubmitting(true);
    const orderId = crypto.randomUUID();
    try {
      // Step 1: Check live stock for every cart item before touching the DB
      const stockChecks = await Promise.all(
        items.map(async (i) => {
          if (i.variantId) {
            const { data } = await supabase
              .from("product_variants")
              .select("stock")
              .eq("id", i.variantId)
              .single();
            return { name: i.name, needed: i.quantity, available: data?.stock ?? 0 };
          }
          const { data } = await supabase
            .from("products")
            .select("stock")
            .eq("id", i.productId)
            .single();
          return { name: i.name, needed: i.quantity, available: data?.stock ?? 0 };
        }),
      );
      const short = stockChecks.filter((c) => c.available < c.needed);
      if (short.length > 0) {
        const names = short.map((c) => c.name).join(", ");
        toast.error(
          lang === "ar"
            ? `المخزون غير كافٍ للمنتج: ${names}`
            : `Insufficient stock for: ${names}`,
        );
        return;
      }

      // Step 2: Insert order
      const { error } = await supabase
        .from("orders")
        .insert({
          id: orderId,
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          governorate,
          total_iqd: total,
          notes,
          status: "pending",
        } as any);
      if (error) throw error;

      // Step 3: Insert order items
      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: orderId,
          product_id: i.productId,
          product_name: i.name,
          quantity: i.quantity,
          price_iqd: i.priceIqd,
          color: i.color ?? null,
          size: i.size ?? null,
          variant_id: i.variantId ?? null,
        })),
      );
      if (itemsErr) throw itemsErr;

      // Step 4: Decrement stock (best-effort — DB function enforces GREATEST(0,...))
      await Promise.all(
        items.flatMap((i) => {
          const calls = [
            (supabase as any).rpc("decrement_product_stock", {
              _product_id: i.productId,
              _qty: i.quantity,
            }),
          ];
          if (i.variantId) {
            calls.push(
              (supabase as any).rpc("decrement_variant_stock", {
                _variant_id: i.variantId,
                _qty: i.quantity,
              }),
            );
          }
          return calls;
        }),
      );
      clear();
      setDone(true);
    } catch (e: any) {
      toast.error(
        lang === "ar" ? "تعذر إرسال الطلب، حاول مرة أخرى." : "Order failed. Please try again.",
      );
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
          <h1 className="mt-6 font-display text-4xl uppercase tracking-wider">{dict.shop.orderPlaced[lang]}</h1>
          <p className="mt-3 text-muted-foreground">{dict.shop.orderPlacedBody[lang]}</p>
          <Link to="/shop" className="mt-8 inline-block bg-primary px-6 py-3 text-sm uppercase tracking-widest text-primary-foreground">
            {dict.nav.shop[lang]}
          </Link>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="font-display text-4xl uppercase tracking-wider md:text-6xl">{dict.shop.cart[lang]}</h1>

        {items.length === 0 ? (
          <div className="mt-12 border border-border bg-card p-12 text-center text-muted-foreground">
            {dict.shop.emptyCart[lang]}
            <div className="mt-6">
              <Link to="/shop" className="bg-primary px-6 py-3 text-sm uppercase tracking-widest text-primary-foreground">
                {dict.nav.shop[lang]}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_360px]">
            <div className="border border-border">
              {items.map((i) => (
                <div key={i.productId + (i.color ?? "") + (i.size ?? "")} className="flex gap-4 border-b border-border p-4 last:border-b-0">
                  <div className="h-20 w-20 flex-none bg-muted">
                    {i.imageUrl && <img src={i.imageUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{i.name}</div>
                    {(i.color || i.size) && (
                      <div className="text-xs text-muted-foreground">{[i.color, i.size].filter(Boolean).join(" · ")}</div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => setQty(i.productId, i.color, i.size, i.quantity - 1)} className="h-7 w-7 border border-border">−</button>
                      <span className="w-6 text-center text-sm">{i.quantity}</span>
                      <button
                        onClick={() => setQty(i.productId, i.color, i.size, i.quantity + 1)}
                        disabled={i.stock !== undefined && i.quantity >= i.stock}
                        className="h-7 w-7 border border-border disabled:opacity-30"
                      >+</button>
                    </div>
                    {i.stock !== undefined && i.quantity >= i.stock && (
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-amber-600">
                        {dict.shop.onlyLeft[lang].replace("{n}", String(i.stock))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => remove(i.productId, i.color, i.size)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="font-display text-primary">{formatIQD(i.priceIqd * i.quantity, lang)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-border bg-card p-6">
              <div className="mb-4 flex justify-between font-display text-lg">
                <span className="uppercase tracking-widest">{dict.shop.total[lang]}</span>
                <span className="text-primary">{formatIQD(total, lang)}</span>
              </div>
              <select
                className="mt-3 w-full border border-border bg-background p-3 text-sm"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
              >
                <option value="">{dict.shop.chooseGovernorate[lang]}</option>
                {IRAQI_GOVERNORATES.map((g) => (
                  <option key={g.en} value={g.en}>
                    {lang === "ar" ? g.ar : g.en}
                  </option>
                ))}
              </select>
              <input className="mt-3 w-full border border-border bg-background p-3 text-sm" placeholder={dict.shop.address[lang]} value={address} onChange={(e) => setAddress(e.target.value)} />
              <textarea className="mt-3 w-full border border-border bg-background p-3 text-sm" rows={2} placeholder={dict.booking.notes[lang]} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <input className="mt-3 w-full border border-border bg-background p-3 text-sm" placeholder={dict.booking.name[lang]} value={name} onChange={(e) => setName(e.target.value)} />
              <input className="mt-3 w-full border border-border bg-background p-3 text-sm" placeholder={dict.booking.phone[lang]} value={phone} onChange={(e) => setPhone(normalizePhoneDigits(e.target.value))} />
              <p className="mt-3 text-xs text-muted-foreground">{dict.shop.paymentNote[lang]}</p>
              <button
                onClick={submit}
                disabled={submitting || !name || !phone || !governorate || !address}
                className="mt-4 w-full bg-primary py-3 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-30"
              >
                {dict.shop.placeOrder[lang]}
              </button>
            </div>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}