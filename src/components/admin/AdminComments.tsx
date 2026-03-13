import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, MessageSquare, Reply, User } from "lucide-react";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_name: string;
  content: string;
  created_at: string;
}

interface PostInfo {
  id: string;
  title: string;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const AdminComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPost, setFilterPost] = useState("__all__");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [{ data: cData }, { data: pData }] = await Promise.all([
      supabase.from("blog_post_comments").select("*").order("created_at", { ascending: false }),
      supabase.from("blog_posts").select("id, title").order("title", { ascending: true }),
    ]);
    setComments((cData as Comment[]) || []);
    setPosts((pData as PostInfo[]) || []);
    setLoading(false);
  };

  const deleteComment = async (id: string) => {
    // ON DELETE CASCADE handles replies
    if (!window.confirm("Delete this comment and all its replies?")) return;
    const { error } = await supabase.from("blog_post_comments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    // Remove the comment and any replies from state
    setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
    toast.success("Comment deleted");
  };

  const deleteReply = async (id: string) => {
    if (!window.confirm("Delete this reply?")) return;
    const { error } = await supabase.from("blog_post_comments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setComments(prev => prev.filter(c => c.id !== id));
    toast.success("Reply deleted");
  };

  const filtered = filterPost === "__all__" ? comments : comments.filter(c => c.post_id === filterPost);
  const topLevel = filtered.filter(c => !c.parent_id);
  const repliesMap = filtered.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  const getPostTitle = (postId: string) => posts.find(p => p.id === postId)?.title || "Unknown Post";

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mt-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Comments <span className="text-base font-normal text-muted-foreground">({comments.length})</span>
        </h2>
      </div>

      {/* Filter by post */}
      {posts.length > 0 && (
        <select
          value={filterPost}
          onChange={e => setFilterPost(e.target.value)}
          className="h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground"
        >
          <option value="__all__">All Posts</option>
          {posts.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      )}

      {topLevel.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {topLevel.map(comment => (
            <div key={comment.id} className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{comment.user_name}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      on <span className="font-medium text-foreground/70">{getPostTitle(comment.post_id)}</span>
                    </p>
                    <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0" onClick={() => deleteComment(comment.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Replies */}
              {(repliesMap[comment.id] || []).length > 0 && (
                <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
                  {(repliesMap[comment.id] || []).map(reply => (
                    <div key={reply.id} className="flex items-start gap-2 ml-6">
                      <Reply size={12} className="text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-foreground">{reply.user_name}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(reply.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{reply.content}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0 h-6 w-6 p-0" onClick={() => deleteReply(reply.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminComments;
