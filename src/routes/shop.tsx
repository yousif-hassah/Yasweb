import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/hooks/use-i18n";
import { useCart } from "@/hooks/use-cart";
import { dict } from "@/lib/translations";
import { formatIQD, SITE } from "@/lib/site-config";
import { toast } from "sonner";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: `Shop & Products | المتجر والمنتجات — ${SITE.nameEn}` },
      {
        name: "description",
        content: "Professional grooming products, hair creams, oils, and styling tools from YAS Barbershop. منتجات الحلاقة والعناية الاحترافية بالشعر واللحية وأدوات التصفيف من صالون ياس.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { lang } = useI18n();
  const { add } = useCart();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // Auto-open product when URL has ?p=<productId> (shared ad links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("p");
    if (pid) setOpenId(pid);
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: variants = [] } = useQuery({
    queryKey: ["product-variants"],
    queryFn: async () => (await supabase.from("product_variants").select("*")).data ?? [],
  });

  const filtered = categoryId ? products.filter((p) => p.category_id === categoryId) : products;
  const open = products.find((p) => p.id === openId);
  const openVariants = open ? variants.filter((v: any) => v.product_id === open.id) : [];

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-6xl">{dict.nav.shop[lang]}</h1>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryId(null)}
            className={`border px-4 py-2 text-xs uppercase tracking-widest ${!categoryId ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
          >
            {dict.portfolio.all[lang]}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`border px-4 py-2 text-xs uppercase tracking-widest ${categoryId === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
            >
              {lang === "ar" ? c.name_ar : c.name_en}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:gap-6">
          {filtered.map((p) => {
            const price = p.discount_price_iqd ?? p.price_iqd;
            return (
              <button
                key={p.id}
                onClick={() => setOpenId(p.id)}
                className="group block border border-border bg-card text-start"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt={lang === "ar" ? p.name_ar : p.name_en} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">—</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-sm">{lang === "ar" ? p.name_ar : p.name_en}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-primary">{formatIQD(price, lang)}</span>
                    {p.discount_price_iqd && (
                      <span className="text-xs text-muted-foreground line-through">{formatIQD(p.price_iqd, lang)}</span>
                    )}
                  </div>
                  {p.stock <= 0 && <div className="mt-2 text-xs uppercase text-destructive">{dict.shop.soldOut[lang]}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {open && (
        <ProductDialog
          product={open}
          variants={openVariants}
          onClose={() => setOpenId(null)}
          onAdd={(color, size, qty, variant) => {
            add({
              productId: open.id,
              name: lang === "ar" ? open.name_ar : open.name_en,
              priceIqd: open.discount_price_iqd ?? open.price_iqd,
              quantity: qty,
              color,
              size,
              variantId: variant?.id,
              stock: variant ? variant.stock : (open.stock ?? undefined),
              imageUrl: open.image_url ?? undefined,
            });
            toast.success(`${lang === "ar" ? open.name_ar : open.name_en} ✓`);
            setOpenId(null);
          }}
          lang={lang}
        />
      )}
    </SiteLayout>
  );
}

function ProductDialog({
  product,
  variants,
  onClose,
  onAdd,
  lang,
}: {
  product: any;
  variants: any[];
  onClose: () => void;
  onAdd: (color: string | undefined, size: string | undefined, qty: number, variant: any | undefined) => void;
  lang: "en" | "ar";
}) {
  const [color, setColor] = useState<string | undefined>(product.colors?.[0]);
  const [size, setSize] = useState<string | undefined>(product.sizes?.[0]);
  const [qty, setQty] = useState(1);
  const variant = variants.length > 0
    ? variants.find((v) => (v.color ?? "") === (color ?? "") && (v.size ?? "") === (size ?? ""))
    : undefined;
  const effectiveStock = variants.length > 0 ? (variant?.stock ?? 0) : (product.stock ?? 0);
  const soldOut = effectiveStock <= 0;
  const maxQty = Math.max(1, effectiveStock || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={onClose}>
      <div className="grid max-h-[90vh] w-full max-w-3xl gap-0 overflow-auto border border-border bg-card md:grid-cols-2" onClick={(e) => e.stopPropagation()}>
        <div className="aspect-square bg-muted">
          {product.image_url && <img src={product.image_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-6">
          <h3 className="font-display text-2xl uppercase tracking-wider">{lang === "ar" ? product.name_ar : product.name_en}</h3>
          <div className="mt-2 font-display text-xl text-primary">
            {formatIQD(product.discount_price_iqd ?? product.price_iqd, lang)}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{lang === "ar" ? product.description_ar : product.description_en}</p>

          {product.colors && product.colors.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{dict.shop.color[lang]}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c: string) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`border px-3 py-1 text-xs ${color === c ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{dict.shop.size[lang]}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`border px-3 py-1 text-xs ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!soldOut && effectiveStock <= 5 && (
            <div className="mt-3 text-xs uppercase tracking-widest text-amber-600">
              {dict.shop.onlyLeft[lang].replace("{n}", String(effectiveStock))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{dict.shop.qty[lang]}</span>
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-8 w-8 border border-border">−</button>
            <span className="w-6 text-center">{qty}</span>
            <button onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} className="h-8 w-8 border border-border disabled:opacity-30">+</button>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={onClose} className="flex-1 border border-border py-3 text-xs uppercase tracking-widest">
              {dict.admin.cancel[lang]}
            </button>
            <button
              disabled={soldOut}
              onClick={() => onAdd(color, size, qty, variant)}
              className="flex-1 bg-primary py-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-30"
            >
              {soldOut ? dict.shop.soldOut[lang] : dict.shop.addToCart[lang]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}