import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  postId: string;
}

const BlogReactions = ({ postId }: Props) => {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("blog_post_reactions")
        .select("reaction_type")
        .eq("post_id", postId);
      if (data) {
        setLikes(data.filter(r => r.reaction_type === "like").length);
        setDislikes(data.filter(r => r.reaction_type === "dislike").length);
      }
    };
    fetchCounts();
  }, [postId]);

  const react = async (type: "like" | "dislike") => {
    setSubmitting(true);
    if (type === "like") setLikes(p => p + 1);
    else setDislikes(p => p + 1);

    const { error } = await supabase
      .from("blog_post_reactions")
      .insert({ post_id: postId, reaction_type: type });

    if (error) {
      // rollback
      if (type === "like") setLikes(p => p - 1);
      else setDislikes(p => p - 1);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => react("like")}
        disabled={submitting}
        className="gap-1.5"
      >
        <ThumbsUp size={15} /> {likes}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => react("dislike")}
        disabled={submitting}
        className="gap-1.5"
      >
        <ThumbsDown size={15} /> {dislikes}
      </Button>
    </div>
  );
};

export default BlogReactions;
