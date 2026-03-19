export type AdminRole = "super_admin" | "admin" | "editor" | "moderator";

// Permission map: what each role can access
const PERMISSIONS: Record<AdminRole, Set<string>> = {
  super_admin: new Set([
    "dashboard", "analytics", "seo", "seo-monitor", "performance",
    "notices", "study-materials", "blog", "blog-categories", "blog-tags", "comments", "testimonials",
    "gallery", "faq", "media", "themes", "atmosphere",
    "education", "experience", "achievements", "approach", "subjects",
    "training", "security-logs", "videos", "global-trash", "admin-profile",
    "hero-section", "about-section", "homepage-sections", "announcement-bar",
    "homepage-section-content",
    "coaching-info", "contact-details", "social-links", "whatsapp-chat",
    "site-info", "footer-settings", "hero-animation",
    "activity-timeline", "admin-management", "login-history",
  ]),
  admin: new Set([
    "dashboard", "analytics", "seo", "seo-monitor", "performance",
    "notices", "study-materials", "blog", "blog-categories", "blog-tags", "comments", "testimonials",
    "gallery", "faq", "media", "themes", "atmosphere",
    "education", "experience", "achievements", "approach", "subjects",
    "training", "security-logs", "videos", "global-trash", "admin-profile",
    "hero-section", "about-section", "homepage-sections", "announcement-bar",
    "homepage-section-content",
    "coaching-info", "contact-details", "social-links", "whatsapp-chat",
    "site-info", "footer-settings", "hero-animation",
    "activity-timeline", "login-history",
  ]),
  editor: new Set([
    "dashboard", "admin-profile",
    "blog", "blog-categories", "blog-tags", "study-materials", "videos",
    "media", "gallery", "global-trash",
  ]),
  moderator: new Set([
    "dashboard", "admin-profile",
    "comments", "notices", "testimonials", "faq", "global-trash",
  ]),
};

export const canAccess = (role: AdminRole | null, tab: string): boolean => {
  if (!role) return false;
  return PERMISSIONS[role]?.has(tab) ?? false;
};

export const canManageAdmins = (role: AdminRole | null): boolean => {
  return role === "super_admin";
};

export const getRoleLabel = (role: AdminRole): string => {
  const labels: Record<AdminRole, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    editor: "Editor",
    moderator: "Moderator",
  };
  return labels[role] || role;
};

export const getRoleBadgeColor = (role: AdminRole): string => {
  const colors: Record<AdminRole, string> = {
    super_admin: "bg-red-500/15 text-red-400 border-red-500/30",
    admin: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    editor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    moderator: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return colors[role] || "bg-muted text-muted-foreground";
};

export const ASSIGNABLE_ROLES: AdminRole[] = ["admin", "editor", "moderator"];
