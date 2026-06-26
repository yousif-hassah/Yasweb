CREATE POLICY "Barbers can view customers of their bookings"
ON public.customers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'barber')
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.customer_id = customers.id
      AND b.barber_id = public.current_barber_id(auth.uid())
  )
);