import { Mail, Phone, MapPin, Facebook, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { t } = useLanguage();
  const { get } = useSiteSettings();

  const siteName = get("site_info", "site_name", "Iqbal Sir");
  const phone = get("footer", "phone", get("contact", "phone", "+8801687476714"));
  const email = get("footer", "email", get("contact", "email", "i.h.himel@gmail.com"));
  const address = get("footer", "address", "Kishoreganj, Bangladesh");
  const copyright = get("footer", "copyright", "");
  const facebookUrl = get("social", "facebook", "https://www.fb.com/i.h.himel");
  const whatsappLink = get("social", "whatsapp_link", "https://wa.me/8801733579100");
  const emailLink = get("social", "email_link", `mailto:${email}`);

  const navLinks = [
    { label: t.nav.home, href: "#home" },
    { label: t.nav.about, href: "#about" },
    { label: t.nav.subjects, href: "#subjects" },
    { label: t.nav.experience, href: "#experience" },
    { label: t.nav.education, href: "#education" },
    { label: t.nav.resources, href: "#resources" },
    { label: t.nav.blog, href: "#blog" },
    { label: t.nav.contact, href: "#contact" },
  ];

  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-display text-xl font-bold gradient-text mb-3">{siteName}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t.footer.tagline}</p>
          </div>
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">{t.footer.quick_links}</h4>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map(link => <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</a>)}
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">{t.footer.contact}</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Phone size={14} className="text-primary" /><span>{phone}</span></div>
              <div className="flex items-center gap-2"><Mail size={14} className="text-primary" /><span>{email}</span></div>
              <div className="flex items-center gap-2"><MapPin size={14} className="text-primary" /><span>{address}</span></div>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {copyright || `© ${new Date().getFullYear()} ${siteName}. ${t.footer.rights}`}
          </p>
          <div className="flex items-center gap-3">
            <a href={facebookUrl.startsWith("http") ? facebookUrl : `https://${facebookUrl}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"><Facebook size={16} /></a>
            <a href={whatsappLink.startsWith("http") ? whatsappLink : `https://${whatsappLink}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"><MessageCircle size={16} /></a>
            <a href={emailLink.startsWith("mailto:") ? emailLink : `mailto:${emailLink}`} className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"><Mail size={16} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
