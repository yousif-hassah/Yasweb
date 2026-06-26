
-- 1) barbers.email: hide from anonymous users
REVOKE SELECT ON public.barbers FROM anon;
GRANT SELECT (id, name_ar, name_en, bio_ar, bio_en, experience_ar, experience_en, photo_url, sort_order, active, created_at) ON public.barbers TO anon;

-- 2) bookings: only expose availability columns to anon/authenticated
REVOKE SELECT ON public.bookings FROM anon, authenticated;
GRANT SELECT (id, barber_id, starts_at, ends_at, status) ON public.bookings TO anon, authenticated;
GRANT SELECT ON public.bookings TO service_role;

-- 3) customers: remove public SELECT and unrestricted INSERT, expose via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Public can lookup customer" ON public.customers;
DROP POLICY IF EXISTS "Public can create customer" ON public.customers;

CREATE OR REPLACE FUNCTION public.upsert_customer_by_phone(_name text, _phone text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_name text := nullif(btrim(_name), '');
  v_phone text := nullif(btrim(_phone), '');
BEGIN
  IF v_phone IS NULL OR length(v_phone) < 5 OR length(v_phone) > 20 THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;
  IF v_name IS NULL OR length(v_name) > 120 THEN
    RAISE EXCEPTION 'invalid name';
  END IF;

  SELECT id INTO v_id FROM public.customers WHERE phone = v_phone LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO public.customers (name, phone, no_show_count)
    VALUES (v_name, v_phone, 0)
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_customer_by_phone(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.upsert_customer_by_phone(text, text) TO anon, authenticated;

-- 4) order_items: restrict inserts to recently-created pending orders
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
CREATE POLICY "Public can create order items"
  ON public.order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.status = 'pending'::order_status
        AND o.created_at > now() - interval '15 minutes'
    )
  );
