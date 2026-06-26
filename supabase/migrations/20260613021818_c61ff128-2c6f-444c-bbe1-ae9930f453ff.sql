
SELECT cron.unschedule('daily-barber-bookings');

ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS barbers_user_id_unique ON public.barbers(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.current_barber_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.barbers WHERE user_id = _user_id LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.current_barber_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_barber_id(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Barbers can view their own bookings" ON public.bookings;
CREATE POLICY "Barbers can view their own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'barber')
    AND barber_id = public.current_barber_id(auth.uid())
  );
