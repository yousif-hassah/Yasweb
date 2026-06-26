REVOKE SELECT ON public.barbers FROM anon;
GRANT SELECT (id, name_en, name_ar, slug, active, sort_order, years, role_en, role_ar, specialty_en, specialty_ar, experience_en, experience_ar, bio_en, bio_ar, photo_url, created_at) ON public.barbers TO anon;

REVOKE SELECT ON public.bookings FROM anon;
GRANT SELECT (id, barber_id, starts_at, ends_at, status) ON public.bookings TO anon;