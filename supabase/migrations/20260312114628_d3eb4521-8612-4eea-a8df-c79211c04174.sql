
CREATE TABLE public.professional_training (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en text NOT NULL DEFAULT '',
  title_bn text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Award',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read professional_training" ON public.professional_training FOR SELECT USING (true);
CREATE POLICY "Admins can insert professional_training" ON public.professional_training FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update professional_training" ON public.professional_training FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete professional_training" ON public.professional_training FOR DELETE USING (has_role(auth.uid(), 'admin'));
