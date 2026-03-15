import { Globe, Bell, MessageCircle, FileText, Settings2, Atom, Upload } from "lucide-react";
import type { SectionConfig } from "../AdminSettingsSection";

export const heroSectionConfig: SectionConfig = {
  key: "hero",
  label: "Hero Section",
  icon: Globe,
  description: "Configure the main hero banner on the homepage.",
  fields: [
    { name: "title_en", label: "Title (English)", type: "text", placeholder: "Learn Science the Smart Way" },
    { name: "title_bn", label: "Title (Bangla)", type: "text", placeholder: "বিজ্ঞান শিখো স্মার্ট উপায়ে" },
    { name: "subtitle_en", label: "Subtitle (English)", type: "textarea", placeholder: "Concept-based learning for SSC and HSC students..." },
    { name: "subtitle_bn", label: "Subtitle (Bangla)", type: "textarea", placeholder: "SSC ও HSC শিক্ষার্থীদের জন্য..." },
    { name: "tagline_en", label: "Tagline / Badge (English)", type: "text", placeholder: "Science Educator · Kishoreganj" },
    { name: "tagline_bn", label: "Tagline / Badge (Bangla)", type: "text", placeholder: "বিজ্ঞান শিক্ষক · কিশোরগঞ্জ" },
    { name: "cta_text_en", label: "CTA Button Text (English)", type: "text", placeholder: "Join a Batch" },
    { name: "cta_text_bn", label: "CTA Button Text (Bangla)", type: "text", placeholder: "ব্যাচে ভর্তি হোন" },
    { name: "cta_link", label: "CTA Link", type: "text", placeholder: "#contact" },
    { name: "hero_image", label: "Hero Image", type: "image" },
  ],
};

export const aboutSectionConfig: SectionConfig = {
  key: "about",
  label: "About Section",
  icon: Globe,
  description: "Edit the About section content on the homepage.",
  fields: [
    { name: "intro_text_en", label: "Intro Text (English)", type: "textarea", placeholder: "With 10+ years of teaching experience..." },
    { name: "intro_text_bn", label: "Intro Text (Bangla)", type: "textarea", placeholder: "১০+ বছরের শিক্ষকতার অভিজ্ঞতা নিয়ে..." },
    { name: "point_1_en", label: "Bullet Point 1 (English)", type: "textarea" },
    { name: "point_1_bn", label: "Bullet Point 1 (Bangla)", type: "textarea" },
    { name: "point_2_en", label: "Bullet Point 2 (English)", type: "textarea" },
    { name: "point_2_bn", label: "Bullet Point 2 (Bangla)", type: "textarea" },
    { name: "point_3_en", label: "Bullet Point 3 (English)", type: "textarea" },
    { name: "point_3_bn", label: "Bullet Point 3 (Bangla)", type: "textarea" },
  ],
};

export const homepageSectionsConfig: SectionConfig = {
  key: "homepage_sections",
  label: "Homepage Sections Toggle",
  icon: Globe,
  description: "Show or hide sections on the homepage.",
  fields: [
    { name: "show_hero", label: "Show Hero Section", type: "toggle" },
    { name: "show_about", label: "Show About Section", type: "toggle" },
    { name: "show_subjects", label: "Show Subjects Section", type: "toggle" },
    { name: "show_approach", label: "Show Approach Section", type: "toggle" },
    { name: "show_stats", label: "Show Stats Section", type: "toggle" },
    { name: "show_gallery", label: "Show Gallery Section", type: "toggle" },
    { name: "show_testimonials", label: "Show Testimonials Section", type: "toggle" },
    { name: "show_experience", label: "Show Experience Section", type: "toggle" },
    { name: "show_training", label: "Show Professional Training Section", type: "toggle" },
    { name: "show_education", label: "Show Education Section", type: "toggle" },
    { name: "show_notices", label: "Show Notices Section", type: "toggle" },
    { name: "show_resources", label: "Show Download Center Section", type: "toggle" },
    { name: "show_blog", label: "Show Blog Section", type: "toggle" },
    { name: "show_faq", label: "Show FAQ Section", type: "toggle" },
    { name: "show_contact", label: "Show Contact Section", type: "toggle" },
  ],
};

export const announcementBarConfig: SectionConfig = {
  key: "announcement",
  label: "Announcement Bar",
  icon: Bell,
  description: "Configure the scrolling announcement bar at the top of the site.",
  fields: [
    { name: "enabled", label: "Enable Announcement", type: "toggle" },
    { name: "text", label: "Announcement Text", type: "text", placeholder: "New batch starting soon!" },
    { name: "link", label: "Announcement Link", type: "text", placeholder: "https://..." },
  ],
};

export const coachingInfoConfig: SectionConfig = {
  key: "coaching",
  label: "Coaching Information",
  icon: Globe,
  description: "Details about coaching batches, schedule, and location.",
  fields: [
    { name: "location", label: "Coaching Location", type: "text", placeholder: "Kishoreganj, Bangladesh" },
    { name: "class_days", label: "Class Days", type: "text", placeholder: "Saturday – Thursday" },
    { name: "class_time", label: "Class Time", type: "text", placeholder: "4:00 PM – 8:00 PM" },
    { name: "batch_size", label: "Batch Size", type: "text", placeholder: "20 students per batch" },
    { name: "target_students", label: "Target Students", type: "text", placeholder: "SSC / HSC" },
    { name: "medium", label: "Medium", type: "select", options: [{ value: "bangla", label: "Bangla" }, { value: "english", label: "English" }, { value: "both", label: "Bangla & English" }] },
  ],
};

export const contactDetailsConfig: SectionConfig = {
  key: "contact",
  label: "Contact Details",
  icon: MessageCircle,
  description: "Phone, email, address and map configuration.",
  fields: [
    { name: "phone", label: "Phone", type: "text" },
    { name: "whatsapp", label: "WhatsApp", type: "text" },
    { name: "email", label: "Email", type: "text" },
    { name: "address", label: "Address", type: "textarea" },
    { name: "map_embed_url", label: "Map Embed URL", type: "text" },
  ],
};

export const socialLinksConfig: SectionConfig = {
  key: "social",
  label: "Social Links",
  icon: Globe,
  description: "Links to social media profiles.",
  fields: [
    { name: "facebook", label: "Facebook", type: "text" },
    { name: "whatsapp_link", label: "WhatsApp Link", type: "text" },
    { name: "email_link", label: "Email Link", type: "text" },
  ],
};

export const whatsappChatConfig: SectionConfig = {
  key: "whatsapp",
  label: "WhatsApp Chat",
  icon: MessageCircle,
  description: "Configure the floating WhatsApp chat button.",
  fields: [
    { name: "enabled", label: "Enable WhatsApp Chat", type: "toggle" },
    { name: "number", label: "WhatsApp Number", type: "text", placeholder: "+880XXXXXXXXXX" },
    { name: "default_message", label: "Default Message", type: "text", placeholder: "Hello! I want to know about classes." },
  ],
};

export const siteInfoConfig: SectionConfig = {
  key: "site_info",
  label: "Site Information",
  icon: Settings2,
  description: "Basic site name, tagline, logo, and defaults.",
  fields: [
    { name: "site_name", label: "Site Name", type: "text", placeholder: "Iqbal Sir" },
    { name: "site_tagline", label: "Site Tagline", type: "text", placeholder: "Science Teacher in Kishoreganj" },
    { name: "logo_url", label: "Logo Upload", type: "image" },
    { name: "favicon_url", label: "Favicon Upload", type: "image" },
    { name: "default_theme", label: "Default Theme", type: "select", options: [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }] },
    { name: "default_language", label: "Default Language", type: "select", options: [{ value: "en", label: "English" }, { value: "bn", label: "Bangla" }] },
  ],
};

export const footerSettingsConfig: SectionConfig = {
  key: "footer",
  label: "Footer Settings",
  icon: FileText,
  description: "Footer description, contact info, and copyright text.",
  fields: [
    { name: "description", label: "Footer Description", type: "textarea" },
    { name: "email", label: "Footer Email", type: "text" },
    { name: "phone", label: "Footer Phone", type: "text" },
    { name: "address", label: "Footer Address", type: "textarea" },
    { name: "copyright", label: "Copyright Text", type: "text", placeholder: "© 2025 Iqbal Sir. All rights reserved." },
  ],
};

export const heroAnimationConfig: SectionConfig = {
  key: "hero_animation",
  label: "Hero Animation",
  icon: Atom,
  description: "Adjust the particle animation parameters on the hero section.",
  fields: [
    { name: "min_spacing", label: "Minimum Spacing (px)", type: "range", min: 60, max: 250, step: 10 },
    { name: "repulsion_force", label: "Repulsion Force", type: "range", min: 5, max: 80, step: 5 },
    { name: "min_speed", label: "Minimum Speed", type: "range", min: 2, max: 30, step: 1 },
    { name: "max_speed", label: "Maximum Speed", type: "range", min: 10, max: 80, step: 2 },
  ],
};
