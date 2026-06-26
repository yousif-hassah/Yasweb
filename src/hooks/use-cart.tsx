import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartItem = {
  productId: string;
  variantId?: string;
  name: string;
  priceIqd: number;
  quantity: number;
  color?: string;
  size?: string;
  stock?: number;
  imageUrl?: string;
};

type Ctx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, color?: string, size?: string) => void;
  setQty: (productId: string, color: string | undefined, size: string | undefined, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const keyMatch = (a: CartItem, productId: string, color?: string, size?: string) =>
    a.productId === productId && (a.color || "") === (color || "") && (a.size || "") === (size || "");

  const add = (item: CartItem) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => keyMatch(p, item.productId, item.color, item.size));
      if (i >= 0) {
        const next = [...prev];
        const cap = item.stock ?? next[i].stock ?? Infinity;
        next[i] = { ...next[i], stock: item.stock ?? next[i].stock, quantity: Math.min(cap, next[i].quantity + item.quantity) };
        return next;
      }
      const cap = item.stock ?? Infinity;
      return [...prev, { ...item, quantity: Math.min(cap, item.quantity) }];
    });
  };

  const remove = (productId: string, color?: string, size?: string) =>
    setItems((prev) => prev.filter((p) => !keyMatch(p, productId, color, size)));

  const setQty = (productId: string, color: string | undefined, size: string | undefined, qty: number) =>
    setItems((prev) =>
      prev.map((p) => (keyMatch(p, productId, color, size) ? { ...p, quantity: Math.max(1, Math.min(p.stock ?? Infinity, qty)) } : p))
    );

  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.priceIqd * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}