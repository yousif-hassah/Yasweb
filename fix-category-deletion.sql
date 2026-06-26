-- Update the foreign key constraint on public.products so that category deletion is blocked if products exist within it.
-- Run this in your Supabase SQL editor:
-- https://supabase.com/dashboard/project/uijkjcwafpqrkurbkqxo/sql/new

ALTER TABLE public.products 
  DROP CONSTRAINT IF EXISTS products_category_id_fkey;

ALTER TABLE public.products 
  ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES public.categories(id) 
  ON DELETE RESTRICT;
