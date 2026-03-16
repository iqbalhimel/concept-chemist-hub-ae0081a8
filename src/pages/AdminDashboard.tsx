import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, BookOpen, Bell, Download,
  Image, HelpCircle, Palette, Settings, LogOut, Menu, X,
  MessageSquare, Globe, MessageSquareQuote, GraduationCap,
  Briefcase, Trophy, Lightbulb, Atom, BarChart3, CloudSun, Search, Zap, TrendingUp, Shield, Video, Tag,
  ChevronDown, ChevronRight, Home, PenTool, User, Phone, Wrench, Eye, Lock, Activity, Trash2, Users
} from "lucide-react";
import { canAccess, getRoleLabel } from "@/lib/permissions";
import AdminNotices from "@/components/admin/AdminNotices";
import AdminStudyMaterials from "@/components/admin/AdminStudyMaterials";
import AdminBlogPosts from "@/components/admin/AdminBlogPosts";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminFAQ from "@/components/admin/AdminFAQ";
import AdminMediaLibrary from "@/components/admin/AdminMediaLibrary";
import AdminThemes from "@/components/admin/AdminThemes";
import AdminComments from "@/components/admin/AdminComments";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";
import AdminEducation from "@/components/admin/AdminEducation";
import AdminExperience from "@/components/admin/AdminExperience";
import AdminAchievements from "@/components/admin/AdminAchievements";
import AdminApproach from "@/components/admin/AdminApproach";
import AdminSubjects from "@/components/admin/AdminSubjects";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminAtmosphere from "@/components/admin/AdminAtmosphere";
import AdminProfessionalTraining from "@/components/admin/AdminProfessionalTraining";
import AdminSEO from "@/components/admin/AdminSEO";
import AdminPerformance from "@/components/admin/AdminPerformance";
import AdminSeoMonitor from "@/components/admin/AdminSeoMonitor";
import AdminSecurityLogs from "@/components/admin/AdminSecurityLogs";
import AdminVideos from "@/components/admin/AdminVideos";
import AdminBlogCategories from "@/components/admin/AdminBlogCategories";
import AdminTags from "@/components/admin/AdminTags";
import AdminSettingsSection from "@/components/admin/AdminSettingsSection";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import AdminActivityTimeline from "@/components/admin/AdminActivityTimeline";
import AdminGlobalTrash from "@/components/admin/AdminGlobalTrash";
import AdminProfile from "@/components/admin/AdminProfile";
import AdminManagement from "@/components/admin/AdminManagement";
import {
  heroSectionConfig, aboutSectionConfig, homepageSectionsConfig,
  announcementBarConfig, coachingInfoConfig, contactDetailsConfig,
  socialLinksConfig, whatsappChatConfig, siteInfoConfig, footerSettingsConfig,
  heroAnimationConfig,
} from "@/components/admin/settings/sectionConfigs";

type Tab =
  | "dashboard" | "analytics" | "seo" | "seo-monitor" | "performance"
  | "notices" | "study-materials" | "blog" | "blog-categories" | "blog-tags" | "comments" | "testimonials"
  | "gallery" | "faq" | "media" | "themes" | "atmosphere"
  | "education" | "experience" | "achievements" | "approach" | "subjects"
  | "training" | "security-logs" | "videos" | "global-trash" | "admin-profile" | "admin-management"
  // Settings-based tabs
  | "hero-section" | "about-section" | "homepage-sections" | "announcement-bar"
  | "coaching-info" | "contact-details" | "social-links" | "whatsapp-chat"
  | "site-info" | "footer-settings" | "hero-animation"
  | "activity-timeline";

type NavItem = {
  id: Tab;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
};

type NavEntry = NavItem | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => "items" in entry;

const fullNavigation: NavEntry[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "global-trash", label: "Trash", icon: Trash2 },
  {
    label: "Homepage",
    icon: Home,
    items: [
      { id: "hero-section", label: "Hero Section", icon: Globe },
      { id: "about-section", label: "About Section", icon: Globe },
      { id: "homepage-sections", label: "Sections Toggle", icon: Eye },
      { id: "announcement-bar", label: "Announcement Bar", icon: Bell },
    ],
  },
  {
    label: "Content",
    icon: FileText,
    items: [
      { id: "notices", label: "Notices", icon: Bell },
      { id: "study-materials", label: "Study Materials", icon: Download },
      { id: "blog", label: "Blog Posts", icon: FileText },
      { id: "blog-categories", label: "Blog Categories", icon: Tag },
      { id: "blog-tags", label: "Blog Tags", icon: Tag },
      { id: "comments", label: "Comments", icon: MessageSquare },
      { id: "gallery", label: "Gallery", icon: Image },
      { id: "videos", label: "Educational Videos", icon: Video },
      { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
      { id: "faq", label: "FAQ", icon: HelpCircle },
      { id: "media", label: "Media Library", icon: Image },
    ],
  },
  {
    label: "Teacher Profile",
    icon: User,
    items: [
      { id: "subjects", label: "Teaching Subjects", icon: Atom },
      { id: "approach", label: "Teaching Approach", icon: Lightbulb },
      { id: "achievements", label: "Achievements", icon: Trophy },
      { id: "experience", label: "Experience", icon: Briefcase },
      { id: "training", label: "Professional Training", icon: Trophy },
      { id: "education", label: "Education", icon: GraduationCap },
    ],
  },
  {
    label: "Contact Settings",
    icon: Phone,
    items: [
      { id: "coaching-info", label: "Coaching Information", icon: Globe },
      { id: "contact-details", label: "Contact Details", icon: Phone },
      { id: "social-links", label: "Social Links", icon: Globe },
      { id: "whatsapp-chat", label: "WhatsApp Chat", icon: MessageSquare },
    ],
  },
  {
    label: "Site Settings",
    icon: Settings,
    items: [
      { id: "site-info", label: "Site Information", icon: Settings },
      { id: "footer-settings", label: "Footer Settings", icon: FileText },
    ],
  },
  {
    label: "Design",
    icon: Palette,
    items: [
      { id: "themes", label: "Themes", icon: Palette },
      { id: "atmosphere", label: "Atmosphere", icon: CloudSun },
      { id: "hero-animation", label: "Hero Animation", icon: Atom },
    ],
  },
  {
    label: "SEO & Analytics",
    icon: TrendingUp,
    items: [
      { id: "seo", label: "SEO", icon: Search },
      { id: "seo-monitor", label: "SEO Monitor", icon: TrendingUp },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "performance", label: "Performance", icon: Zap },
    ],
  },
  {
    label: "Security",
    icon: Lock,
    items: [
      { id: "admin-profile", label: "Admin Profile", icon: User },
      { id: "admin-management", label: "Admin Management", icon: Users },
      { id: "security-logs", label: "Security Logs", icon: Shield },
      { id: "activity-timeline", label: "Activity Timeline", icon: Activity },
    ],
  },
];

const AdminDashboard = () => {
  const { signOut, user, adminRole } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filter navigation based on role permissions
  const navigation = useMemo(() => {
    return fullNavigation.reduce<NavEntry[]>((acc, entry) => {
      if (isGroup(entry)) {
        const filteredItems = entry.items.filter(item => canAccess(adminRole, item.id));
        if (filteredItems.length > 0) {
          acc.push({ ...entry, items: filteredItems });
        }
      } else {
        if (canAccess(adminRole, entry.id)) {
          acc.push(entry);
        }
      }
      return acc;
    }, []);
  }, [adminRole]);

  // Flatten for label lookup
  const allItems: NavItem[] = navigation.flatMap(e => isGroup(e) ? e.items : [e]);

  useEffect(() => {
    const fetchTrashCount = async () => {
      const tables = ["blog_posts", "notices", "study_materials", "testimonials", "gallery"];
      const results = await Promise.all(
        tables.map(t => (supabase as any).from(t).select("id", { count: "exact", head: true }).not("trashed_at", "is", null))
      );
      setTrashCount(results.reduce((sum, r) => sum + (r.count ?? 0), 0));
    };
    fetchTrashCount();
  }, [activeTab]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleTabClick = (tab: Tab) => {
    // Check permission before navigating
    if (!canAccess(adminRole, tab)) return;
    setActiveTab(tab);
    setSidebarOpen(false);
    navigation.forEach(e => {
      if (isGroup(e) && e.items.some(i => i.id === tab)) {
        setExpandedGroups(prev => new Set(prev).add(e.label));
      }
    });
  };

  const renderContent = () => {
    // Permission gate
    if (activeTab !== "dashboard" && !canAccess(adminRole, activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Shield size={48} className="text-muted-foreground" />
          <p className="text-muted-foreground">You don't have permission to access this section.</p>
        </div>
      );
    }

    switch (activeTab) {
      case "analytics": return <AdminAnalytics />;
      case "seo": return <AdminSEO />;
      case "seo-monitor": return <AdminSeoMonitor />;
      case "performance": return <AdminPerformance />;
      case "notices": return <AdminNotices />;
      case "study-materials": return <AdminStudyMaterials />;
      case "blog": return <AdminBlogPosts />;
      case "blog-categories": return <AdminBlogCategories />;
      case "blog-tags": return <AdminTags />;
      case "comments": return <AdminComments />;
      case "testimonials": return <AdminTestimonials />;
      case "gallery": return <AdminGallery />;
      case "faq": return <AdminFAQ />;
      case "education": return <AdminEducation />;
      case "experience": return <AdminExperience />;
      case "achievements": return <AdminAchievements />;
      case "approach": return <AdminApproach />;
      case "training": return <AdminProfessionalTraining />;
      case "subjects": return <AdminSubjects />;
      case "media": return <AdminMediaLibrary />;
      case "themes": return <AdminThemes />;
      case "atmosphere": return <AdminAtmosphere />;
      case "security-logs": return <AdminSecurityLogs />;
      case "videos": return <AdminVideos />;
      case "activity-timeline": return <AdminActivityTimeline />;
      case "global-trash": return <AdminGlobalTrash />;
      case "admin-profile": return <AdminProfile />;
      case "admin-management": return <AdminManagement />;
      case "hero-section": return <AdminSettingsSection section={heroSectionConfig} />;
      case "about-section": return <AdminSettingsSection section={aboutSectionConfig} />;
      case "homepage-sections": return <AdminSettingsSection section={homepageSectionsConfig} />;
      case "announcement-bar": return <AdminSettingsSection section={announcementBarConfig} />;
      case "coaching-info": return <AdminSettingsSection section={coachingInfoConfig} />;
      case "contact-details": return <AdminSettingsSection section={contactDetailsConfig} />;
      case "social-links": return <AdminSettingsSection section={socialLinksConfig} />;
      case "whatsapp-chat": return <AdminSettingsSection section={whatsappChatConfig} />;
      case "site-info": return <AdminSettingsSection section={siteInfoConfig} />;
      case "footer-settings": return <AdminSettingsSection section={footerSettingsConfig} />;
      case "hero-animation": return <AdminSettingsSection section={heroAnimationConfig} />;
      default: return <AdminDashboardOverview onNavigate={(tab) => handleTabClick(tab as Tab)} />;
    }
  };

  const renderNavItem = (item: NavItem, indent = false) => (
    <button
      key={item.id}
      onClick={() => handleTabClick(item.id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        indent ? "pl-9" : ""
      } ${
        activeTab === item.id
          ? "bg-primary/15 text-primary shadow-sm shadow-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
      }`}
    >
      <item.icon size={16} className={activeTab === item.id ? "text-primary" : ""} />
      <span className="truncate">{item.label}</span>
      {item.id === "global-trash" && trashCount > 0 && (
        <span className="ml-auto text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
          {trashCount > 99 ? "99+" : trashCount}
        </span>
      )}
      {item.id !== "global-trash" && activeTab === item.id && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      )}
    </button>
  );

  const activeLabel = allItems.find(i => i.id === activeTab)?.label || "Dashboard";
  const roleLabel = adminRole ? getRoleLabel(adminRole) : "";

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-sm border-r border-border transform transition-transform lg:translate-x-0 flex flex-col h-[100dvh] lg:h-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h1 className="font-display text-lg font-bold gradient-text">Admin Panel</h1>
          <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto min-h-0 scrollbar-thin">
          {navigation.map((entry) => {
            if (!isGroup(entry)) {
              return renderNavItem(entry);
            }
            const GroupIcon = entry.icon;
            const expanded = expandedGroups.has(entry.label);
            const hasActive = entry.items.some(i => i.id === activeTab);
            return (
              <div key={entry.label} className="mt-1">
                <button
                  onClick={() => toggleGroup(entry.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    hasActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GroupIcon size={16} />
                  <span className="flex-1 text-left truncate">{entry.label}</span>
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {expanded && (
                  <div className="space-y-0.5 mt-0.5">
                    {entry.items.map(item => renderNavItem(item, true))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border shrink-0 space-y-2">
          <div className="flex items-center gap-2 px-3">
            <span className="text-xs text-muted-foreground truncate flex-1">{user?.email}</span>
            {roleLabel && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                {roleLabel}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => window.open("/", "_blank")}>
              <Globe size={13} className="mr-1" /> View Site
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={signOut}><LogOut size={13} /></Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-h-screen min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <h2 className="font-display font-semibold text-foreground shrink-0">
            {activeLabel}
          </h2>
          <div className="ml-auto">
            <AdminGlobalSearch onNavigate={(tab) => handleTabClick(tab as Tab)} />
          </div>
        </header>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-6xl w-full min-w-0 overflow-x-hidden">{renderContent()}</div>
      </main>
    </div>
  );
};

export default AdminDashboard;
