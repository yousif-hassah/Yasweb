export const SITE = {
  nameEn: "YAS",
  nameAr: "ياس",
  taglineEn: "Sharp cuts. Timeless craft.",
  taglineAr: "قصّات حادّة. حِرفة خالدة.",
  phone: "+9647723326561", // shop WhatsApp for booking confirmations (change here to update)
  email: "yastudio.iq@gmail.com",
  // Inbox that receives the daily 7AM per-barber booking summaries.
  // Change this here to update the recipient.
  notificationEmail: "yastudio.iq@gmail.com",
  // Sender address for all outgoing emails.
  // While the email service is in TEST MODE it can only deliver to
  // notificationEmail above. To deliver to each barber's own inbox:
  //   1) Verify your domain at resend.com/domains
  //   2) Change this to e.g. "YAS Bookings <bookings@yourdomain.com>"
  // Nothing else needs to change — fallback handling is automatic.
  emailFrom: "YAS Bookings <yastudio.iq@gmail.com>",
  address: "Baghdad, Iraq",
  // ── Social / external links ──────────────────────────────────────────────
  // Fill in the real URLs below; leave as "" to hide the icon in the footer.
  instagramUrl: "https://www.instagram.com/yastudio.iq/", // e.g. 
  tiktokUrl: "https://www.tiktok.com/@yastoudio?_r=1&_t=ZS-97WA9AKr7xJ",    // e.g. "https://www.tiktok.com/@yastudio.iq"
  mapsUrl: "https://maps.app.goo.gl/udw5XDuu2J9XkTbM6?g_st=ic",      // e.g. "https://maps.app.goo.gl/your-link" (copy from Google Maps → Share)
  openingHourLocal: 10, // 10:00
  closingHourLocal: 22, // 22:00
  slotMinutes: 60,
};

export const formatIQD = (n: number, lang: "en" | "ar" = "en") => {
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-IQ" : "en-US").format(n);
  return lang === "ar" ? `${formatted} د.ع` : `${formatted} IQD`;
};

export const normalizePhoneDigits = (phone: string): string => {
  if (!phone) return "";
  return phone
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
};

export const waLink = (phone: string, message: string) => {
  const normalized = normalizePhoneDigits(phone);
  const digits = normalized.replace(/[^0-9]/g, "");
  const clean = digits.startsWith("00") ? digits.slice(2) : digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
};

export const openWaLink = (phone: string, message: string) => {
  const url = waLink(phone, message);
  if (typeof window === "undefined") return;

  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // Fall back to a normal external tab if top-level navigation is blocked.
  }

  window.open(url, "_blank", "noopener,noreferrer");
};