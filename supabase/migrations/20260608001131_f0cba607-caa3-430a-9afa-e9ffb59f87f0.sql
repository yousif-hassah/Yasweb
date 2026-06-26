
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size text;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id uuid, _qty integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new integer;
BEGIN
  IF _qty IS NULL OR _qty <= 0 THEN
    RAISE EXCEPTION 'invalid qty';
  END IF;
  UPDATE public.products
    SET stock = GREATEST(0, COALESCE(stock,0) - _qty)
    WHERE id = _product_id
    RETURNING stock INTO v_new;
  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO anon, authenticated;
