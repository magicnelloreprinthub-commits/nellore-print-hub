import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useGetSiteSettings } from "../../hooks/useQueries";
import { useLang } from "../../lib/i18n";

export default function ContactSection() {
  const { t } = useLang();
  const { data: settings } = useGetSiteSettings();

  const phone = settings?.phone ?? "+91 93905 35070";
  const email = settings?.email ?? "magic.nelloreprinthub@gmail.com";
  const address = settings?.address ?? "Dargamitta, Nellore, Andhra Pradesh";

  const contactItems = [
    {
      icon: Phone,
      label: t.contact.phone,
      value: phone,
      href: `tel:${phone.replace(/\s/g, "")}`,
      iconColor: "#833ab4",
      iconBg: "rgba(131,58,180,0.14)",
    },
    {
      icon: Mail,
      label: t.contact.email,
      value: email,
      href: `mailto:${email}`,
      iconColor: "#e1306c",
      iconBg: "rgba(225,48,108,0.14)",
    },
    {
      icon: MapPin,
      label: t.contact.address,
      value: address,
      href: "https://maps.app.goo.gl/gXba56vXmLXL1eFp7?g_st=ic",
      iconColor: "#fcb045",
      iconBg: "rgba(252,176,69,0.14)",
    },
  ];

  return (
    <section id="contact" className="py-10 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase brand-gradient text-white mb-3">
            {t.contact.badge}
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-3">
            {t.contact.heading}
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            {t.contact.subtitle}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Contact info cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            {contactItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    item.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 rounded-xl p-3 border border-white/8 hover:border-white/15 transition-all duration-200 group"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: item.iconBg }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: item.iconColor }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-white/35 uppercase tracking-wider mb-0.5">
                      {item.label}
                    </div>
                    <div className="text-white/80 font-medium text-sm truncate transition-colors">
                      {item.value}
                    </div>
                  </div>
                  {item.href.startsWith("http") && (
                    <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 flex-shrink-0 mt-0.5 transition-colors" />
                  )}
                </motion.a>
              );
            })}

            {/* Compact Open Maps Button */}
            <motion.a
              href="https://maps.app.goo.gl/gXba56vXmLXL1eFp7?g_st=ic"
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="contact.button"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border rounded-lg font-medium mt-1 transition-all duration-200"
              style={{
                color: "#e1306c",
                borderColor: "rgba(225,48,108,0.35)",
                background: "rgba(225,48,108,0.08)",
              }}
            >
              <MapPin className="w-3.5 h-3.5" />
              {t.contact.openMap}
              <ExternalLink className="w-3 h-3" />
            </motion.a>
          </motion.div>

          {/* Map embed visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl overflow-hidden relative min-h-48 border border-white/8"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full brand-gradient flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-display font-bold text-white text-base mb-0.5">
                  Nellore Print Hub
                </div>
                <div className="text-white/45 text-sm">
                  Dargamitta, Nellore
                  <br />
                  Andhra Pradesh, India
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/gXba56vXmLXL1eFp7?g_st=ic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium flex items-center gap-1.5 transition-colors brand-gradient-text"
              >
                {t.contact.viewOnMap}
                <ExternalLink
                  className="w-3.5 h-3.5"
                  style={{ color: "#e1306c" }}
                />
              </a>
            </div>
            {/* Brand dot pattern background */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(225,48,108,0.4) 1px, transparent 1px), radial-gradient(circle, rgba(131,58,180,0.3) 1px, transparent 1px)",
                backgroundSize: "20px 20px, 10px 10px",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
