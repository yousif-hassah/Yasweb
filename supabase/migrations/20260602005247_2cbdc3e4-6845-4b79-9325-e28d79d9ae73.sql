
-- Authenticated admin needs all columns; row-level admin policy still gates the rows.
GRANT SELECT ON public.bookings TO authenticated;
