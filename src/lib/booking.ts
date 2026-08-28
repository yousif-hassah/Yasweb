import { SITE } from "./site-config";

export type Slot = { startsAt: Date; endsAt: Date; label: string };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Creates a Date object representing the given year, month (1-12), day, hour (0-23), minute in Baghdad time (UTC+3).
 * Because Baghdad is UTC+3 with no DST, UTC hour = hour - 3.
 */
export function makeBaghdadDate(year: number, month: number, day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 3, minute, 0, 0));
}

/**
 * Returns today's date ISO string (YYYY-MM-DD) in Baghdad time (UTC+3).
 */
export function todayISO(): string {
  const now = new Date();
  const baghdad = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const y = baghdad.getUTCFullYear();
  const m = pad(baghdad.getUTCMonth() + 1);
  const d = pad(baghdad.getUTCDate());
  return `${y}-${m}-${d}`;
}

/**
 * Formats a 24-hour integer into a 12-hour string (e.g. 12 -> "12:00 PM", 13 -> "1:00 PM").
 */
export function format12hHour(hour: number, minute = 0): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = ((hour + 11) % 12) + 1;
  return `${h12}:${pad(minute)} ${period}`;
}

/**
 * Generates slots for a given dateISO (YYYY-MM-DD) in Baghdad local time (UTC+3)
 * between SITE.openingHourLocal and SITE.closingHourLocal.
 * Slots that have already passed in Baghdad time today are filtered out.
 */
export function generateSlots(dateISO: string): Slot[] {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return [];

  const slots: Slot[] = [];
  const now = new Date(); // UTC instant

  let hour = SITE.openingHourLocal;
  const slotStepHours = SITE.slotMinutes / 60; // 1

  while (hour + slotStepHours <= SITE.closingHourLocal) {
    const startsAt = makeBaghdadDate(y, m, d, hour, 0);
    const endsAt = makeBaghdadDate(y, m, d, hour + Math.floor(slotStepHours), SITE.slotMinutes % 60);

    // Filter out past slots
    if (startsAt.getTime() > now.getTime()) {
      slots.push({
        startsAt,
        endsAt,
        label: format12hHour(hour),
      });
    }

    hour += slotStepHours;
  }

  return slots;
}

/**
 * Checks if a given slot overlaps with any active booking for the specified barber.
 */
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

    const rawBs = String(b.starts_at ?? "");
    const rawBe = String(b.ends_at ?? "");
    const bsStr = rawBs.endsWith("Z") || rawBs.includes("+") ? rawBs : rawBs + "Z";
    const beStr = rawBe.endsWith("Z") || rawBe.includes("+") ? rawBe : rawBe + "Z";

    const bs = new Date(bsStr).getTime();
    const be = new Date(beStr).getTime();
    return s < be && bs < e;
  });
}