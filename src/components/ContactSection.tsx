import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Phone, Mail, MessageCircle, Facebook, Send } from "lucide-react";
import { toast } from "sonner";

const contactInfo = [
  { icon: Phone, label: "Phone", value: "+8801687476714", href: "tel:+8801687476714" },
  { icon: MessageCircle, label: "WhatsApp", value: "+8801733579100", href: "https://wa.me/8801733579100" },
  { icon: Mail, label: "Email", value: "i.h.himel@gmail.com", href: "mailto:i.h.himel@gmail.com" },
  { icon: Facebook, label: "Facebook", value: "fb.com/i.h.himel", href: "https://www.fb.com/i.h.himel" },
];

const ContactSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    toast.success("Message sent! Iqbal Sir will get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Interested in classes or have questions? Reach out today.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="font-display text-xl font-bold text-foreground mb-6">Contact Information</h3>
            {contactInfo.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card-hover p-5 flex items-center gap-4 block"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-foreground font-medium">{item.value}</p>
                </div>
              </a>
            ))}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
              <h3 className="font-display text-xl font-bold text-foreground mb-2">Send a Message</h3>
              <div>
                <label htmlFor="name" className="block text-sm text-muted-foreground mb-1.5">Your Name</label>
                <input
                  id="name"
                  type="text"
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-muted-foreground mb-1.5">Email Address</label>
                <input
                  id="email"
                  type="email"
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm text-muted-foreground mb-1.5">Message</label>
                <textarea
                  id="message"
                  rows={4}
                  maxLength={1000}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all glow-primary"
              >
                <Send size={18} />
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
