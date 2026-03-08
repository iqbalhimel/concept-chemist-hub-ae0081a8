
-- Reactions table
CREATE TABLE public.blog_post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions" ON public.blog_post_reactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reactions" ON public.blog_post_reactions FOR INSERT WITH CHECK (true);

CREATE INDEX idx_reactions_post_id ON public.blog_post_reactions(post_id);

-- Comments table
CREATE TABLE public.blog_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.blog_post_comments(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON public.blog_post_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON public.blog_post_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete comments" ON public.blog_post_comments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_comments_post_id ON public.blog_post_comments(post_id);
CREATE INDEX idx_comments_parent_id ON public.blog_post_comments(parent_id);
