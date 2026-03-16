import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Shield, Camera, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { secureUpload } from "@/lib/secureUpload";

const AdminProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Security fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setName(data.name || "");
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      };

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert(profileData);
        if (error) throw error;
      }

      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const result = await secureUpload(file, file.type, file.name, {
        directory: `avatars/${user.id}`,
      });
      setAvatarUrl(result.publicUrl);
      toast.success("Photo uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return toast.error("Enter a new password");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) return toast.error("Enter a new email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return toast.error("Invalid email format");

    setEmailSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirmation email sent to the new address");
      setNewEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update email");
    } finally {
      setEmailSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "Unknown";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">Admin Profile</h2>
        <p className="text-muted-foreground text-sm">Manage your profile and account security.</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} className="text-primary" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="text-xs">Name</Label>
              <Input id="profile-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email" className="text-xs">Email</Label>
              <Input id="profile-email" value={user?.email || ""} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone" className="text-xs">Phone Number</Label>
              <Input id="profile-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-bio" className="text-xs">Bio / Short Description</Label>
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A few words about yourself..."
              rows={3}
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={16} className="text-primary" /> Account Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Last Login */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Shield size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Login</p>
              <p className="text-sm font-medium text-foreground">{lastSignIn}</p>
            </div>
          </div>

          {/* Change Password */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Change Password</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button onClick={handleChangePassword} disabled={passwordSaving} variant="outline" size="sm" className="gap-1.5">
              {passwordSaving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Update Password
            </Button>
          </div>

          {/* Change Email */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Change Login Email</h4>
            <div className="max-w-sm space-y-1.5">
              <Label htmlFor="new-email" className="text-xs">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="new@email.com"
              />
            </div>
            <p className="text-xs text-muted-foreground">A confirmation email will be sent to verify the new address.</p>
            <Button onClick={handleChangeEmail} disabled={emailSaving} variant="outline" size="sm" className="gap-1.5">
              {emailSaving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Update Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;
