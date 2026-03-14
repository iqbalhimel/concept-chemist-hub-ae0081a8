import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Video, ExternalLink, Save, X } from "lucide-react";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import { Badge } from "@/components/ui/badge";
import { secureUpload } from "@/lib/secureUpload";
import { compressImage } from "@/lib/imageCompression";
import { useVideoMetadataSync } from "@/hooks/useVideoMetadataSync";

type VideoItem = {
  id: string;
  title: string;
  description: string;
  subject: string;
  class_level: string;
  thumbnail_url: string | null;
  video_source: string;
  video_url: string | null;
  duration: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const emptyVideo: Omit<VideoItem, "id" | "created_at" | "updated_at"> = {
  title: "",
  description: "",
  subject: "",
  class_level: "",
  thumbnail_url: null,
  video_source: "youtube",
  video_url: "",
  duration: "",
  is_published: false,
  sort_order: 0,
};

const AdminVideos = () => {
  const csrfGuard = useCsrfGuard();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyVideo);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { syncFromUrl } = useVideoMetadataSync(setForm);

  const handleVideoUrlChange = async (url: string) => {
    setForm(p => ({ ...p, video_url: url }));
    if (url.trim() && form.video_source !== "upload") {
      setSyncing(true);
      await syncFromUrl(url, form.video_source);
      setSyncing(false);
    }
  };

  const fetchVideos = async () => {
    const { data } = await supabase
      .from("educational_videos")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setVideos(data as VideoItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, []);

  const resetForm = () => {
    setForm(emptyVideo);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const result = await secureUpload(compressed.blob, compressed.contentType, file.name, { directory: "video-thumbnails" });
      setForm(prev => ({ ...prev, thumbnail_url: result.publicUrl }));
      toast.success("Thumbnail uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be under 50MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `video-uploads/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      setForm(prev => ({ ...prev, video_url: urlData.publicUrl, video_source: "upload" }));
      toast.success("Video uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    await csrfGuard(async () => {
      if (editingId) {
        const { error } = await supabase.from("educational_videos").update({
          ...form, updated_at: new Date().toISOString()
        }).eq("id", editingId);
        if (error) { toast.error(error.message); return; }
        toast.success("Video updated");
      } else {
        const { error } = await supabase.from("educational_videos").insert(form as any);
        if (error) { toast.error(error.message); return; }
        toast.success("Video added");
      }
      resetForm();
      fetchVideos();
    }, "content_update", editingId ? "Updated educational video" : "Added educational video");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    await csrfGuard(async () => {
      const { error } = await supabase.from("educational_videos").delete().eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Video deleted");
      fetchVideos();
    }, "content_delete", "Deleted educational video");
  };

  const togglePublish = async (video: VideoItem) => {
    await csrfGuard(async () => {
      const { error } = await supabase.from("educational_videos")
        .update({ is_published: !video.is_published, updated_at: new Date().toISOString() })
        .eq("id", video.id);
      if (error) { toast.error(error.message); return; }
      toast.success(video.is_published ? "Unpublished" : "Published");
      fetchVideos();
    }, "content_update", `${video.is_published ? "Unpublished" : "Published"} video: ${video.title}`);
  };

  const startEdit = (video: VideoItem) => {
    setForm({
      title: video.title,
      description: video.description,
      subject: video.subject,
      class_level: video.class_level,
      thumbnail_url: video.thumbnail_url,
      video_source: video.video_source,
      video_url: video.video_url,
      duration: video.duration,
      is_published: video.is_published,
      sort_order: video.sort_order,
    });
    setEditingId(video.id);
    setIsAdding(true);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{videos.length} video(s)</p>
        {!isAdding && (
          <Button onClick={() => { resetForm(); setIsAdding(true); }}><Plus size={16} className="mr-1" /> Add Video</Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Video" : "Add Video"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Video Title *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Introduction to Organic Chemistry" />
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Chemistry" />
              </div>
              <div>
                <Label>Class Level</Label>
                <Input value={form.class_level} onChange={e => setForm(p => ({ ...p, class_level: e.target.value }))} placeholder="e.g. HSC" />
              </div>
              <div>
                <Label>Duration</Label>
                <Input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 12:30" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>

            <div>
              <Label>Thumbnail {form.video_source === "upload" ? "*" : "(auto-synced)"}</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="w-24 h-14 object-cover rounded border border-border" />}
                <Input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} />
              </div>
              {form.video_source !== "upload" && !form.thumbnail_url && (
                <p className="text-xs text-muted-foreground mt-1">Paste a video URL below to auto-fetch thumbnail</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Video Source</Label>
                <Select value={form.video_source} onValueChange={v => setForm(p => ({ ...p, video_source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="google_drive">Google Drive</SelectItem>
                    <SelectItem value="upload">Upload (MP4/WebM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {form.video_source === "upload" ? (
                  <>
                    <Label>Upload Video</Label>
                    <Input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} disabled={uploading} />
                  </>
                ) : (
                  <>
                    <Label>Video URL</Label>
                    <Input value={form.video_url || ""} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder={form.video_source === "youtube" ? "YouTube URL" : "Google Drive share link"} />
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} id="published" />
              <Label htmlFor="published">Published</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={uploading}><Save size={14} className="mr-1" /> {editingId ? "Update" : "Save"}</Button>
              <Button variant="outline" onClick={resetForm}><X size={14} className="mr-1" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video List */}
      <div className="space-y-3">
        {videos.map(video => (
          <Card key={video.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-3 p-4">
              <div className="w-full sm:w-32 h-20 rounded overflow-hidden bg-muted shrink-0">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Video size={24} className="text-muted-foreground/40" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground truncate">{video.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={video.is_published ? "default" : "secondary"}>
                        {video.is_published ? "Published" : "Draft"}
                      </Badge>
                      {video.subject && <span className="text-xs text-muted-foreground">{video.subject}</span>}
                      {video.class_level && <span className="text-xs text-muted-foreground">• {video.class_level}</span>}
                      {video.duration && <span className="text-xs text-muted-foreground">• {video.duration}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {video.video_source === "youtube" ? "YouTube" : video.video_source === "google_drive" ? "Google Drive" : "Upload"}
                      {" • "}{new Date(video.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(video)} title={video.is_published ? "Unpublish" : "Publish"}>
                      <ExternalLink size={16} className={video.is_published ? "text-primary" : "text-muted-foreground"} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(video)}><Edit2 size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(video.id)}><Trash2 size={16} className="text-destructive" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {videos.length === 0 && <p className="text-center text-muted-foreground py-10">No videos yet. Click "Add Video" to get started.</p>}
      </div>
    </div>
  );
};

export default AdminVideos;
