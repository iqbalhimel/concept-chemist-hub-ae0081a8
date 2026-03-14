import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, BookOpen, Bell, Download,
  Image, HelpCircle, Palette, Settings, LogOut, Menu, X,
  MessageSquare, Globe, MessageSquareQuote, GraduationCap,
  Briefcase, Trophy, Lightbulb, Atom, BarChart3, CloudSun, Search, Zap, TrendingUp, Shield
} from "lucide-react";
import AdminSiteSettings from "@/components/admin/AdminSiteSettings";
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

type Tab =
  | "dashboard" | "analytics" | "site-settings" | "seo" | "seo-monitor" | "performance" | "notices" | "study-materials"
  | "blog" | "comments" | "testimonials" | "gallery" | "faq"
  | "media" | "themes" | "atmosphere" | "education" | "experience"
  | "achievements" | "approach" | "subjects" | "training" | "security-logs" | "videos";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "site-settings", label: "Site Settings", icon: Settings },
  { id: "seo", label: "SEO", icon: Search },
  { id: "seo-monitor", label: "SEO Monitor", icon: TrendingUp },
  { id: "performance", label: "Performance", icon: Zap },
  { id: "notices", label: "Notices", icon: Bell },
  { id: "study-materials", label: "Study Materials", icon: Download },
  { id: "blog", label: "Blog Posts", icon: FileText },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "training", label: "Professional Training", icon: Trophy },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "approach", label: "Teaching Approach", icon: Lightbulb },
  { id: "subjects", label: "Teaching Subjects", icon: Atom },
  { id: "media", label: "Media Library", icon: Image },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "atmosphere", label: "Atmosphere", icon: CloudSun },
  { id: "security-logs", label: "Security Logs", icon: Shield },
];

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "analytics": return <AdminAnalytics />;
      case "site-settings": return <AdminSiteSettings />;
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
      default: return <AdminDashboardOverview onNavigate={(tab) => setActiveTab(tab as Tab)} />;
    }
  };

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
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto min-h-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
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
          <h2 className="font-display font-semibold text-foreground capitalize">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
        </header>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-6xl w-full min-w-0 overflow-x-hidden">{renderContent()}</div>
      </main>
    </div>
  );
};

export default AdminDashboard;
