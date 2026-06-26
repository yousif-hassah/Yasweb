-- Enforce stock limits at the DB level to prevent race conditions.
-- Run this in your Supabase SQL editor:
-- https://supabase.com/dashboard/project/uijkjcwafpqrkurbkqxo/sql/new

CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id uuid, _qty integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current integer;
  v_new     integer;
BEGIN
  IF _qty IS NULL OR _qty <= 0 THEN RAISE EXCEPTION 'invalid qty'; END IF;

  -- Lock the row so concurrent requests can't both see the same stock
  SELECT stock INTO v_current FROM public.products WHERE id = _product_id FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'product not found';
  END IF;
  IF v_current < _qty THEN
    RAISE EXCEPTION 'insufficient stock: % available, % requested', v_current, _qty;
  END IF;

  UPDATE public.products SET stock = stock - _qty WHERE id = _product_id RETURNING stock INTO v_new;
  RETURN v_new;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(_variant_id uuid, _qty integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current integer;
  v_new     integer;
BEGIN
  IF _qty IS NULL OR _qty <= 0 THEN RAISE EXCEPTION 'invalid qty'; END IF;

  SELECT stock INTO v_current FROM public.product_variants WHERE id = _variant_id FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'variant not found';
  END IF;
  IF v_current < _qty THEN
    RAISE EXCEPTION 'insufficient stock: % available, % requested', v_current, _qty;
  END IF;

  UPDATE public.product_variants SET stock = stock - _qty WHERE id = _variant_id RETURNING stock INTO v_new;
  RETURN v_new;
END;
$$;
