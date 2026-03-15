CREATE POLICY "Anyone can insert page_views"
ON public.page_views
FOR INSERT
TO public
WITH CHECK (true);