import { ArrowUpRight, Mail, Phone, MapPin, Facebook, MessageCircle, Download } from "lucide-react";
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
    <footer className="border-t border-border bg-card/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-14">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <h4 className="font-display text-lg font-bold text-foreground mb-3">{t.footer.about ?? siteName}</h4>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              {t.footer.tagline}
            </p>
          </div>

          <div className="md:col-span-4">
            <h4 className="font-display font-bold text-foreground mb-4">{t.footer.quick_links}</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-display font-bold text-foreground mb-4">{t.footer.contact}</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone size={14} className="text-primary" />
                <span>{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail size={14} className="text-primary" />
                <span>{email}</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <span>{address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <a
                href={facebookUrl.startsWith("http") ? facebookUrl : `https://${facebookUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl glass-card-hover flex items-center justify-center text-primary"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href={whatsappLink.startsWith("http") ? whatsappLink : `https://${whatsappLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl glass-card-hover flex items-center justify-center text-primary"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href={emailLink.startsWith("mailto:") ? emailLink : `mailto:${emailLink}`}
                className="w-10 h-10 rounded-xl glass-card-hover flex items-center justify-center text-primary"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="section-divider mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {copyright || `© ${new Date().getFullYear()} ${siteName}. ${t.footer.rights}`}
            </p>
            <a
              href="#home"
              className="text-sm font-semibold text-primary hover:underline transition-colors"
            >
              {t.footer.back_to_top ?? "Back to top"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
