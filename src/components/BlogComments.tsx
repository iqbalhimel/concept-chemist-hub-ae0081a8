import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Reply, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_name: string;
  content: string;
  created_at: string;
}

interface Props {
  postId: string;
}

const sanitize = (str: string) =>
  str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;");

/* ── Comment Form ──────────────────────────── */

const CommentForm = ({
  postId,
  parentId = null,
  onPosted,
  onCancel,
  compact = false,
}: {
  postId: string;
  parentId?: string | null;
  onPosted: () => void;
  onCancel?: () => void;
  compact?: boolean;
}) => {
  const { lang, t } = useLanguage();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedContent = content.trim();

    if (!trimmedName) {
      setNameError(t.comments.name_required);
      return;
    }
    if (trimmedName.length > 100) {
      setNameError(t.comments.name_too_long);
      return;
    }
    if (!trimmedContent) {
      toast.error(t.comments.content_required);
      return;
    }
    if (trimmedContent.length > 2000) {
      toast.error(t.comments.content_too_long);
      return;
    }

    setNameError("");
    setSubmitting(true);

    const { error } = await supabase.from("blog_post_comments").insert({
      post_id: postId,
      parent_id: parentId,
      user_name: sanitize(trimmedName),
      content: sanitize(trimmedContent),
    });

    if (error) {
      toast.error(t.comments.post_failed);
    } else {
      toast.success(parentId ? t.comments.reply_posted : t.comments.comment_posted);
      setContent("");
      if (!parentId) setName("");
      onPosted();
    }
    setSubmitting(false);
  };

  return (
    <div className={`space-y-2 ${compact ? "" : "border border-border rounded-lg p-4 bg-card"}`}>
      {!compact && (
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare size={18} /> {t.comments.leave_comment}
        </h3>
      )}
      <div className={compact ? "flex gap-2 items-start" : "space-y-2"}>
        <div className={compact ? "flex-1 space-y-2" : "space-y-2"}>
          <div>
            <Input
              placeholder={t.comments.name_placeholder}
              value={name}
              onChange={e => { setName(e.target.value); setNameError(""); }}
              className={`h-9 ${nameError ? "border-destructive" : ""}`}
              maxLength={100}
            />
            {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
          </div>
          <Textarea
            placeholder={parentId ? t.comments.reply_placeholder : t.comments.comment_placeholder}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={compact ? 2 : 3}
            maxLength={2000}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              <Send size={14} className="mr-1" /> {submitting ? t.comments.posting : parentId ? t.comments.reply : t.comments.post_comment}
            </Button>
            {onCancel && (
              <Button size="sm" variant="ghost" onClick={onCancel}>{t.comments.cancel}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Single Comment ────────────────────────── */

const CommentCard = ({
  comment,
  replies,
  postId,
  onRefresh,
}: {
  comment: Comment;
  replies: Comment[];
  postId: string;
  onRefresh: () => void;
}) => {
  const { lang, t } = useLanguage();
  const [showReply, setShowReply] = useState(false);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
          <span className="font-medium text-sm text-foreground">{comment.user_name}</span>
          <span className="text-xs text-muted-foreground ml-auto">{formatDate(comment.created_at)}</span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
        <button
          onClick={() => setShowReply(!showReply)}
          className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <Reply size={12} /> {t.comments.reply}
        </button>
      </div>

      {replies.length > 0 && (
        <div className="ml-6 sm:ml-10 space-y-2 border-l-2 border-border pl-4">
          {replies.map(reply => (
            <div key={reply.id} className="border border-border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={12} className="text-primary" />
                </div>
                <span className="font-medium text-xs text-foreground">{reply.user_name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(reply.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {showReply && (
        <div className="ml-6 sm:ml-10">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onPosted={() => { setShowReply(false); onRefresh(); }}
            onCancel={() => setShowReply(false)}
            compact
          />
        </div>
      )}
    </div>
  );
};

/* ── Main Comments Section ─────────────────── */

const BlogComments = ({ postId }: Props) => {
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("blog_post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments((data as Comment[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blog_post_comments", filter: `post_id=eq.${postId}` },
        () => { fetchComments(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  const topLevel = comments.filter(c => !c.parent_id);
  const repliesMap = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">
        {t.comments.title} {topLevel.length > 0 && <span className="text-base font-normal text-muted-foreground">({comments.length})</span>}
      </h2>

      <CommentForm postId={postId} onPosted={fetchComments} />

      {loading ? (
        <p className="text-muted-foreground text-sm">{t.comments.loading}</p>
      ) : topLevel.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t.comments.empty}</p>
      ) : (
        <div className="space-y-4">
          {topLevel.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              replies={repliesMap[comment.id] || []}
              postId={postId}
              onRefresh={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogComments;
