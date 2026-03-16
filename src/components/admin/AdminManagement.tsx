import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Shield, Loader2, Search, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminRole, ASSIGNABLE_ROLES, getRoleLabel, getRoleBadgeColor, canManageAdmins } from "@/lib/permissions";
import { logAdminActivity } from "@/lib/activityLogger";

interface AdminUser {
  user_id: string;
  role: AdminRole;
  name: string;
  email: string;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
}

const AdminManagement = () => {
  const { user, adminRole } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // New admin form
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("editor");
  const [creating, setCreating] = useState(false);

  const canManage = canManageAdmins(adminRole);

  const fetchAdmins = async () => {
    setLoading(true);
    // Get all user_roles entries
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role, created_at");

    if (!roles || roles.length === 0) {
      setAdmins([]);
      setLoading(false);
      return;
    }

    // Get profiles for these users
    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url, last_login_at")
      .in("user_id", userIds);

    const profileMap: Record<string, any> = {};
    profiles?.forEach(p => { profileMap[p.user_id] = p; });

    const adminList: AdminUser[] = roles.map(r => ({
      user_id: r.user_id,
      role: r.role as AdminRole,
      name: profileMap[r.user_id]?.name || "Unnamed",
      email: "", // We'll show user_id since we can't query auth.users
      avatar_url: profileMap[r.user_id]?.avatar_url || null,
      last_login_at: profileMap[r.user_id]?.last_login_at || null,
      created_at: r.created_at,
    }));

    setAdmins(adminList);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: AdminRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
      if (error) throw error;

      await logAdminActivity({
        action: "edit",
        module: "site_settings",
        itemId: userId,
        itemTitle: `Role changed to ${getRoleLabel(newRole)}`,
      });

      toast.success(`Role updated to ${getRoleLabel(newRole)}`);
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (userId === user?.id) return toast.error("You cannot remove yourself");

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;

      await logAdminActivity({
        action: "delete",
        module: "site_settings",
        itemId: userId,
        itemTitle: "Admin access removed",
      });

      toast.success("Admin access removed");
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove admin");
    }
  };

  const handleCreateAdmin = async () => {
    if (!newEmail.trim()) return toast.error("Email is required");
    setCreating(true);
    try {
      // Create auth user via admin invite - we'll insert the role directly
      // Since we can't create auth users from client, we add the role for an existing user
      // The admin needs to provide the user_id of an existing auth user
      // For simplicity, we'll use email lookup via a workaround

      // Insert into user_roles - the user must already exist in auth
      // We'll create a profile and role entry
      toast.info("The user must already have an account. Adding their role...");

      // We need the user_id - since we can't query auth.users, prompt for it
      // For now, store a placeholder - in production this would use an edge function
      toast.error("To add a new admin, the user must first create an account via the login page. Then provide their user ID.");
      setCreating(false);
      return;
    } catch (err: any) {
      toast.error(err.message || "Failed to create admin");
    } finally {
      setCreating(false);
    }
  };

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.user_id.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never";

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Shield size={48} className="text-muted-foreground" />
        <p className="text-muted-foreground">You don't have permission to manage admins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">Admin Management</h2>
          <p className="text-muted-foreground text-sm">Manage admin users and their roles.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search admins..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Admin List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={16} className="text-primary" />
            Admin Users ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No admin users found.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(admin => (
                <div key={admin.user_id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {admin.avatar_url ? (
                      <img src={admin.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={18} className="text-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{admin.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{admin.user_id.slice(0, 8)}...</p>
                  </div>

                  {/* Role Badge */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${getRoleBadgeColor(admin.role)}`}>
                    {getRoleLabel(admin.role)}
                  </span>

                  {/* Last Login */}
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">Last login</p>
                    <p className="text-xs text-foreground">{formatDate(admin.last_login_at)}</p>
                  </div>

                  {/* Actions */}
                  {admin.user_id !== user?.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Select
                        value={admin.role}
                        onValueChange={(val) => handleUpdateRole(admin.user_id, val as AdminRole)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_ROLES.map(r => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {getRoleLabel(r)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveAdmin(admin.user_id)}
                      >
                        <UserX size={14} />
                      </Button>
                    </div>
                  )}

                  {admin.user_id === user?.id && (
                    <span className="text-[10px] text-muted-foreground italic shrink-0">You</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagement;
