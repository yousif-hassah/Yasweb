import { SITE } from "./site-config";

export type Slot = { startsAt: Date; endsAt: Date; label: string };

/**
 * Generates 60-min slots for a given local date between openingHourLocal..closingHourLocal.
 * Slots starting in the past are filtered out.
 */
export function generateSlots(dateISO: string): Slot[] {
  const [y, m, d] = dateISO.split("-").map(Number);
  const slots: Slot[] = [];
  let cursor = new Date(y, m - 1, d, SITE.openingHourLocal, 0, 0, 0);
  const close = new Date(y, m - 1, d, SITE.closingHourLocal, 0, 0, 0);
  const now = new Date();
  while (cursor.getTime() + SITE.slotMinutes * 60_000 <= close.getTime()) {
    const end = new Date(cursor.getTime() + SITE.slotMinutes * 60_000);
    if (cursor.getTime() > now.getTime()) {
      slots.push({
        startsAt: new Date(cursor),
        endsAt: end,
        label: format12h(cursor),
      });
    }
    cursor = new Date(cursor.getTime() + SITE.slotMinutes * 60_000);
  }
  return slots;
}

const pad = (n: number) => String(n).padStart(2, "0");

function format12h(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${pad(m)} ${period}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isSlotTaken(
  slot: Slot,
  bookings: { starts_at: string; ends_at: string; barber_id: string; status: string }[],
  barberId: string,
) {
  const s = slot.startsAt.getTime();
  const e = slot.endsAt.getTime();
  return bookings.some((b) => {
    if (b.barber_id !== barberId) return false;
    if (b.status === "cancelled" || b.status === "no_show") return false;
    const bs = new Date(b.starts_at).getTime();
    const be = new Date(b.ends_at).getTime();
    return s < be && bs < e;
  });
}