import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, BookOpen, Bell, Download,
  Image, HelpCircle, Palette, Settings, LogOut, Menu, X,
  MessageSquare, Globe
} from "lucide-react";
import AdminSiteSettings from "@/components/admin/AdminSiteSettings";
import AdminNotices from "@/components/admin/AdminNotices";
import AdminStudyMaterials from "@/components/admin/AdminStudyMaterials";
import AdminBlogPosts from "@/components/admin/AdminBlogPosts";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminFAQ from "@/components/admin/AdminFAQ";
import AdminMediaLibrary from "@/components/admin/AdminMediaLibrary";
import AdminThemes from "@/components/admin/AdminThemes";

type Tab =
  | "dashboard"
  | "site-settings"
  | "notices"
  | "study-materials"
  | "blog"
  | "gallery"
  | "faq"
  | "media"
  | "themes";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "site-settings", label: "Site Settings", icon: Settings },
  { id: "notices", label: "Notices", icon: Bell },
  { id: "study-materials", label: "Study Materials", icon: Download },
  { id: "blog", label: "Blog Posts", icon: FileText },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "media", label: "Media Library", icon: Image },
  { id: "themes", label: "Themes", icon: Palette },
];

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "site-settings":
        return <AdminSiteSettings />;
      case "notices":
        return <AdminNotices />;
      case "study-materials":
        return <AdminStudyMaterials />;
      case "blog":
        return <AdminBlogPosts />;
      case "gallery":
        return <AdminGallery />;
      case "faq":
        return <AdminFAQ />;
      case "media":
        return <AdminMediaLibrary />;
      case "themes":
        return <AdminThemes />;
      default:
        return (
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Welcome, Admin</h2>
            <p className="text-muted-foreground mb-8">Manage your website content from here.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tabs.filter(t => t.id !== "dashboard").map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="glass-card-hover p-6 text-left"
                >
                  <t.icon className="text-primary mb-3" size={24} />
                  <p className="font-display font-semibold text-foreground">{t.label}</p>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="font-display text-lg font-bold gradient-text">Admin Panel</h1>
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2 truncate px-3">{user?.email}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open("/", "_blank")}>
              <Globe size={14} className="mr-1" /> View Site
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <h2 className="font-display font-semibold text-foreground capitalize">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
        </header>
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
