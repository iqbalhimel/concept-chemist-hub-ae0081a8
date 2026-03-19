import { motion } from "framer-motion";
import { memo } from "react";
import { BookOpen, Monitor, Users, Lightbulb, MapPin, Calendar, Clock, UsersRound, GraduationCap, Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { sanitizeHtml } from "@/lib/sanitize";

type CoachingInfo = Record<string, string>;

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const vp = { once: true, amount: 0.15 as const };

const AboutSection = () => {
  const { t, lang } = useLanguage();
  const { get, settings } = useSiteSettings();

  const isBn = lang === "bn";

  const coaching = (settings["coaching"] as CoachingInfo | undefined) || null;

  const intro = get("about", isBn ? "intro_text_bn" : "intro_text_en", "") || get("about", "intro_text_en", "") || t.about.intro;
  const point1 = get("about", isBn ? "point_1_bn" : "point_1_en", "") || get("about", "point_1_en", "") || t.about.point_1;
  const point2 = get("about", isBn ? "point_2_bn" : "point_2_en", "") || get("about", "point_2_en", "") || t.about.point_2;
  const point3 = get("about", isBn ? "point_3_bn" : "point_3_en", "") || get("about", "point_3_en", "") || t.about.point_3;

  const highlights = [
    { icon: BookOpen, label: t.about.highlight_1 },
    { icon: Monitor, label: t.about.highlight_2 },
    { icon: Users, label: t.about.highlight_3 },
    { icon: Lightbulb, label: t.about.highlight_4 },
  ];

  const coachingItems = coaching ? [
    { icon: MapPin, label: t.about.coaching_location, value: coaching.location },
    { icon: Calendar, label: t.about.coaching_class_days, value: coaching.class_days },
    { icon: Clock, label: t.about.coaching_class_time, value: coaching.class_time },
    { icon: UsersRound, label: t.about.coaching_batch_size, value: coaching.batch_size },
    { icon: GraduationCap, label: t.about.coaching_target, value: coaching.target_students },
    { icon: Languages, label: t.about.coaching_medium, value: coaching.medium },
  ].filter(item => item.value) : [];

  return (
    <section id="about" className="section-padding section-gradient">
      <div className="container mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.about.title_1} <span className="gradient-text">{t.about.title_highlight}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">{t.about.subtitle}</p>

          <div className="glass-card p-8 md:p-12 mb-10">
            <p className="text-secondary-foreground leading-relaxed text-lg mb-6" dangerouslySetInnerHTML={{ __html: sanitizeHtml(intro) }} />
            <ul className="space-y-3 text-secondary-foreground text-base">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(point1) }} />
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(point2) }} />
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(point3) }} />
              </li>
            </ul>
          </div>

          {coachingItems.length > 0 && (
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="glass-card p-6 md:p-8 mb-10"
            >
              <h3 className="font-display font-semibold text-foreground text-xl mb-5 text-center">
                🎓 {t.about.coaching_title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {coachingItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <item.icon size={20} className="text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium text-foreground capitalize">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {highlights.map((item, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }} className="glass-card-hover p-5 text-center">
                <item.icon className="mx-auto mb-3 text-primary" size={28} />
                <p className="text-sm font-medium text-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default memo(AboutSection);
