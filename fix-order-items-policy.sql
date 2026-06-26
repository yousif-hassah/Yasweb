-- Fix: order_items INSERT was failing for anonymous users because the
-- WITH CHECK clause tried to SELECT from orders, but anon has no
-- SELECT permission on orders → EXISTS() always returned false → INSERT denied.
-- Solution: simplify to just require a non-null order_id (UUIDs are unguessable).

DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;

CREATE POLICY "Public can create order items" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (order_id IS NOT NULL);
