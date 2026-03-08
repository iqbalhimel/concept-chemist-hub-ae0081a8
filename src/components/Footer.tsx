import { Mail, Phone, MapPin } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Subjects", href: "#subjects" },
  { label: "Experience", href: "#experience" },
  { label: "Education", href: "#education" },
  { label: "Resources", href: "#resources" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-display text-xl font-bold gradient-text mb-3">Iqbal Sir</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Making Science Easy for Students. Concept-based learning for SSC and HSC students in Kishoreganj, Bangladesh.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2">
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

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary" />
                <span>+8801687476714</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-primary" />
                <span>i.h.himel@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <span>Kishoreganj, Bangladesh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MD. IQBAL HUSEN. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
