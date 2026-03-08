import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Phone, Mail, MessageCircle, Facebook, Send } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ContactSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const { t } = useLanguage();
  const { get } = useSiteSettings();

  const phone = get("contact", "phone", "+8801687476714");
  const whatsapp = get("contact", "whatsapp", "+8801733579100");
  const email = get("contact", "email", "i.h.himel@gmail.com");
  const mapUrl = get("contact", "map_embed_url", "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29045.75!2d90.76!3d24.43!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x37564ee40fafffff%3A0x1c15f9a1e3f1a0e7!2sKishoreganj%20Sadar!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd");
  const facebook = get("social", "facebook", "https://www.fb.com/i.h.himel");

  const contactInfo = [
    { icon: Phone, label: t.contact.phone, value: phone, href: `tel:${phone}` },
    { icon: MessageCircle, label: t.contact.whatsapp, value: whatsapp, href: `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}` },
    { icon: Mail, label: t.contact.email, value: email, href: `mailto:${email}` },
    { icon: Facebook, label: t.contact.facebook, value: facebook.replace(/https?:\/\/(www\.)?/, ""), href: facebook.startsWith("http") ? facebook : `https://${facebook}` },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const emailVal = form.email.trim();
    const message = form.message.trim();

    if (!name || !emailVal || !message) {
      toast.error(t.contact.error_fields);
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      toast.error(t.contact.error_fields);
      return;
    }

    // Validate lengths
    if (name.length > 100 || emailVal.length > 255 || message.length > 1000) {
      toast.error(t.contact.error_fields);
      return;
    }

    setSending(true);

    // Send via WhatsApp as the delivery mechanism
    const waNumber = whatsapp.replace(/[^0-9]/g, "");
    const waText = encodeURIComponent(
      `📩 New Contact Form Message\n\nName: ${name}\nEmail: ${emailVal}\n\nMessage:\n${message}`
    );
    window.open(`https://wa.me/${waNumber}?text=${waText}`, "_blank");

    toast.success(t.contact.success);
    setForm({ name: "", email: "", message: "" });
    setSending(false);
  };

  return (
    <section id="contact" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">{t.contact.title_1} <span className="gradient-text">{t.contact.title_highlight}</span></h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">{t.contact.subtitle}</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-4">
            <h3 className="font-display text-xl font-bold text-foreground mb-6">{t.contact.info_title}</h3>
            {contactInfo.map(item => (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="glass-card-hover p-5 flex items-center gap-4 block">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><item.icon size={20} className="text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">{item.label}</p><p className="text-foreground font-medium">{item.value}</p></div>
              </a>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 }}>
            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{t.contact.form_title}</h3>
              <div><label htmlFor="name" className="block text-sm text-muted-foreground mb-1.5">{t.contact.label_name}</label>
                <input id="name" type="text" maxLength={100} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder={t.contact.placeholder_name} /></div>
              <div><label htmlFor="email" className="block text-sm text-muted-foreground mb-1.5">{t.contact.label_email}</label>
                <input id="email" type="email" maxLength={255} value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder={t.contact.placeholder_email} /></div>
              <div><label htmlFor="message" className="block text-sm text-muted-foreground mb-1.5">{t.contact.label_message}</label>
                <textarea id="message" rows={4} maxLength={1000} value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" placeholder={t.contact.placeholder_message} /></div>
              <button type="submit" disabled={sending} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all glow-primary disabled:opacity-50"><Send size={18} />{t.contact.send}</button>
            </form>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.4 }} className="max-w-5xl mx-auto mt-12">
          <div className="glass-card overflow-hidden rounded-xl">
            <iframe title="Location" src={mapUrl} width="100%" height="300" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
