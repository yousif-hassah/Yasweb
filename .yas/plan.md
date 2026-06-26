## Design direction

Dark, bold, minimal — direct nod to rascalsco.com:
- Near-black background (`#0a0a0a`), high-contrast white type, single accent (warm amber/gold for CTAs)
- Heavy condensed sans (Bebas Neue / Archivo Black) for headings, clean grotesk (Inter) for body
- Full-bleed hero with **looping background video**, oversized "Welcome to [Shop Name]" + bold "Booking" button
- Generous whitespace, square edges, thin hairline borders between panels
- Each homepage section is a distinct full-width "panel" with its own dark surface tone

I'll use a **placeholder shop name "RAZOR & CO"** — easy to change later. You'll provide the hero video URL (or I'll use a stock barbershop loop until you upload one to storage).

## Site structure (public)

Top nav (with EN/AR toggle, RTL flips automatically):
`Home · Booking · Shop · Portfolio · About · Contact`

1. **Home** — hero video + Welcome + Booking CTA → portfolio teaser panel (image grid + "View all" → /portfolio, and "Book now" → /booking) → booking-process explainer panel → featured products → contact strip
2. **Booking** — 4-step flow: Service → Barber (shows that barber's price for that service) → Date & Time (10:00–22:00, 75-min slots, blocks all of that barber's slots up to that booking) → Name + WhatsApp phone → confirmation screen
3. **Shop** — product grid filtered by category, product detail with color/variant, cart, checkout form (name/phone/address — **no online payment**, order goes to admin)
4. **Portfolio** — full grid of photos + videos, filterable
5. **About** — shop description + barber cards. Each barber has a "View work & rate" button → modal/page with 5 photos + 5-star rating widget + aggregate rating
6. **Contact** — name + phone + message form → emails admin

## Booking rules (exact)

- Hours: 10:00 → 22:00, 75-min slots per barber
- Slot held the moment a booking is created (status = pending), so the same barber can't be double-booked even across different services
- All of a barber's slots from now until the booking time remain visible/bookable (only the booked slot is blocked) — matches your spec
- Statuses: `pending → confirmed → paid` OR `cancelled` / `no_show`
- On `no_show`, the customer is flagged; admin sees a warning badge next time they book

## Admin panel (`/admin`, email/password)

Tabs: **Bookings · Products · Categories · Portfolio · Barbers · Orders · Reviews · No-shows**

- Bookings: list with filters; per-row actions Confirm / Cancel / Mark Paid / Mark No-show. Each action shows a "Send WhatsApp" button that opens `wa.me/<phone>?text=<pre-filled message>` (confirmation, cancellation, reminder copy)
- Products: CRUD + image upload + stock (sold-out auto-hides from shop) + discount price + categories
- Portfolio: upload photos/videos, assign to barber optionally
- Barbers: CRUD + photo + bio + per-service price overrides + email (for appointment notifications later)
- Reviews: moderate ratings
- Orders: customer info + items

## Notifications (UI now, providers later)

Per your choice, every notification action is a real button that today opens **wa.me deep links** with the correct pre-filled text (booking confirmation in IQD, date/time; reminder; cancellation). Email-to-admin for contact form + barber-appointment-email + auto 3h/20-day reminders need Twilio WhatsApp Business + Resend later — I'll leave clean hooks ready to swap in.

## Tech / data

**Lovable Cloud (must enable)** for:
- Auth (admin email/password)
- Postgres tables: `profiles`, `user_roles` (admin role), `barbers`, `services`, `barber_services` (price per barber per service), `bookings`, `customers`, `categories`, `products`, `product_variants`, `orders`, `order_items`, `portfolio_items`, `reviews`, `contact_messages`
- Storage buckets: `portfolio`, `products`, `barbers`, `hero` (for the hero video)
- RLS: public read on shop/portfolio/barbers/services/reviews; insert-only for bookings/orders/contact/reviews from anon; admin full access via `has_role(auth.uid(),'admin')`

Stack stays TanStack Start + Tailwind + shadcn. i18n via a lightweight context (no extra library) with EN/AR JSON dictionaries and `dir="rtl"` switch.

## Build order

1. Enable Lovable Cloud + migration for all tables/RLS/storage buckets
2. Design system (dark palette, fonts, panel components) + bilingual context + nav/footer + RTL
3. Home (hero video placeholder, panels, portfolio teaser, booking-process explainer)
4. Booking flow (4 steps + slot availability logic)
5. Portfolio page
6. About page + barber rating modal
7. Shop (list, detail, cart, checkout)
8. Contact form
9. Admin: auth gate + Bookings tab + Products + Categories + Portfolio + Barbers + Orders + Reviews
10. Wire wa.me deep-link buttons throughout admin
11. Seed sample data (3 barbers, 6 services, sample products) so it looks alive

## Things I'll need from you after the first build

- Real shop name + logo
- Hero video file (upload to Cloud → Storage → `hero` bucket)
- Real barber names / photos / bios
- Twilio WhatsApp Business + Resend keys when you're ready to enable real notifications

This is a big build — expect a long first turn. After it's live, you can iterate on copy, colors, and polish.