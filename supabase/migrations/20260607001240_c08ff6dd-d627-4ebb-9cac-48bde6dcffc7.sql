
-- Add new statuses for shop orders
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';

-- Add slug + years to barbers (used in admin form)
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS years integer;
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS role_en text;
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS role_ar text;
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS specialty_en text;
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS specialty_ar text;

-- Add sizes column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes text[];

-- Add description columns to portfolio
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS description_ar text;

-- Announcements table for site banner
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_en text NOT NULL,
  message_ar text NOT NULL,
  link_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active announcements"
  ON public.announcements FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
