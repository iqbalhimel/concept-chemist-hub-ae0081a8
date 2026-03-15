import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, BookOpen, Bell, Download,
  Image, HelpCircle, Palette, Settings, LogOut, Menu, X,
  MessageSquare, Globe, MessageSquareQuote, GraduationCap,
  Briefcase, Trophy, Lightbulb, Atom, BarChart3, CloudSun, Search, Zap, TrendingUp, Shield, Video,
  ChevronDown, ChevronRight, Home, PenTool, User, Phone, Wrench, Eye, Lock
} from "lucide-react";
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
import AdminSettingsSection from "@/components/admin/AdminSettingsSection";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import {
  heroSectionConfig, aboutSectionConfig, homepageSectionsConfig,
  announcementBarConfig, coachingInfoConfig, contactDetailsConfig,
  socialLinksConfig, whatsappChatConfig, siteInfoConfig, footerSettingsConfig,
  heroAnimationConfig,
} from "@/components/admin/settings/sectionConfigs";

type Tab =
  | "dashboard" | "analytics" | "seo" | "seo-monitor" | "performance"
  | "notices" | "study-materials" | "blog" | "comments" | "testimonials"
  | "gallery" | "faq" | "media" | "themes" | "atmosphere"
  | "education" | "experience" | "achievements" | "approach" | "subjects"
  | "training" | "security-logs" | "videos"
  // Settings-based tabs
  | "hero-section" | "about-section" | "homepage-sections" | "announcement-bar"
  | "coaching-info" | "contact-details" | "social-links" | "whatsapp-chat"
  | "site-info" | "footer-settings" | "hero-animation";

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

const navigation: NavEntry[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
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
      { id: "security-logs", label: "Security Logs", icon: Shield },
    ],
  },
];

// Flatten all tab IDs for label lookup
const allItems: NavItem[] = navigation.flatMap(e => isGroup(e) ? e.items : [e]);

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Start with the group containing the active tab expanded
    const set = new Set<string>();
    navigation.forEach(e => {
      if (isGroup(e) && e.items.some(i => i.id === "dashboard")) set.add(e.label);
    });
    return set;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    // Auto-expand the group containing this tab
    navigation.forEach(e => {
      if (isGroup(e) && e.items.some(i => i.id === tab)) {
        setExpandedGroups(prev => new Set(prev).add(e.label));
      }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      // Existing component tabs
      case "analytics": return <AdminAnalytics />;
      case "seo": return <AdminSEO />;
      case "seo-monitor": return <AdminSeoMonitor />;
      case "performance": return <AdminPerformance />;
      case "notices": return <AdminNotices />;
      case "study-materials": return <AdminStudyMaterials />;
      case "blog": return <AdminBlogPosts />;
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
      // Settings-based tabs
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
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        indent ? "pl-9" : ""
      } ${
        activeTab === item.id
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <item.icon size={16} />
      <span className="truncate">{item.label}</span>
    </button>
  );

  const activeLabel = allItems.find(i => i.id === activeTab)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 flex flex-col h-[100dvh] lg:h-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h1 className="font-display text-lg font-bold gradient-text">Admin Panel</h1>
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto min-h-0">
          {navigation.map((entry, idx) => {
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
        <div className="p-3 border-t border-border shrink-0">
          <div className="text-xs text-muted-foreground mb-2 truncate px-3">{user?.email}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open("/", "_blank")}>
              <Globe size={14} className="mr-1" /> View Site
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}><LogOut size={14} /></Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-h-screen min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <h2 className="font-display font-semibold text-foreground">
            {activeLabel}
          </h2>
        </header>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-6xl w-full min-w-0 overflow-x-hidden">{renderContent()}</div>
      </main>
    </div>
  );
};

export default AdminDashboard;
