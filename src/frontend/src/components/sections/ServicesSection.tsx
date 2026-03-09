import { IdCard, Package, Palette, Shirt, Signpost, Tag } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useLang } from "../../lib/i18n";

const SERVICE_ICONS = [IdCard, Signpost, Tag, Shirt, Package, Palette];

const SERVICE_STYLES = [
  // Business Cards — Instagram purple
  {
    iconColor: "#833ab4",
    iconBg: "rgba(131,58,180,0.18)",
    border: "rgba(131,58,180,0.22)",
    hoverBorder: "rgba(131,58,180,0.60)",
    glow: "rgba(131,58,180,0.20)",
    cardBg: "rgba(131,58,180,0.07)",
  },
  // Flex Banners — Instagram pink-red
  {
    iconColor: "#e1306c",
    iconBg: "rgba(225,48,108,0.18)",
    border: "rgba(225,48,108,0.22)",
    hoverBorder: "rgba(225,48,108,0.60)",
    glow: "rgba(225,48,108,0.20)",
    cardBg: "rgba(225,48,108,0.07)",
  },
  // Sticker Printing — Instagram red
  {
    iconColor: "#fd1d1d",
    iconBg: "rgba(253,29,29,0.18)",
    border: "rgba(253,29,29,0.22)",
    hoverBorder: "rgba(253,29,29,0.60)",
    glow: "rgba(253,29,29,0.20)",
    cardBg: "rgba(253,29,29,0.07)",
  },
  // T-Shirt Printing — Instagram orange
  {
    iconColor: "#f56040",
    iconBg: "rgba(245,96,64,0.18)",
    border: "rgba(245,96,64,0.22)",
    hoverBorder: "rgba(245,96,64,0.60)",
    glow: "rgba(245,96,64,0.20)",
    cardBg: "rgba(245,96,64,0.07)",
  },
  // Packaging Boxes — Instagram gold
  {
    iconColor: "#fcb045",
    iconBg: "rgba(252,176,69,0.18)",
    border: "rgba(252,176,69,0.22)",
    hoverBorder: "rgba(252,176,69,0.60)",
    glow: "rgba(252,176,69,0.20)",
    cardBg: "rgba(252,176,69,0.07)",
  },
  // Graphic Design — deep purple to pink mid
  {
    iconColor: "#c13584",
    iconBg: "rgba(193,53,132,0.18)",
    border: "rgba(193,53,132,0.22)",
    hoverBorder: "rgba(193,53,132,0.60)",
    glow: "rgba(193,53,132,0.20)",
    cardBg: "rgba(193,53,132,0.07)",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function ServicesSection() {
  const { t } = useLang();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section id="services" className="py-16 px-6 relative">
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-05 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(131,58,180,0.22), transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase brand-gradient text-white mb-4">
            {t.services.badge}
          </span>
          <div className="section-divider mb-6" />
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-4">
            {t.services.heading}
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            {t.services.subtitle}
          </p>
        </motion.div>

        {/* Services grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"
        >
          {t.services.items.map((service, index) => {
            const Icon = SERVICE_ICONS[index];
            const style = SERVICE_STYLES[index];
            const ocid = `services.card.${index + 1}`;
            const isHovered = hoveredIdx === index;
            return (
              <motion.div
                key={service.title}
                variants={cardVariants}
                data-ocid={ocid}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="card-hover rounded-2xl p-4 group cursor-default relative overflow-hidden border transition-all duration-300"
                style={{
                  background: isHovered
                    ? style.cardBg
                    : "rgba(255,255,255,0.03)",
                  borderColor: isHovered ? style.hoverBorder : style.border,
                  boxShadow: isHovered
                    ? `0 8px 40px ${style.glow}`
                    : "0 2px 8px rgba(0,0,0,0.20)",
                }}
              >
                {/* Icon */}
                <div className="relative z-10 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300"
                    style={{ background: style.iconBg }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: style.iconColor }}
                    />
                  </div>
                </div>
                {/* Text */}
                <div className="relative z-10">
                  <h3 className="font-display font-bold text-base text-white mb-2">
                    {service.title}
                  </h3>
                  <p className="text-white/45 text-xs leading-relaxed">
                    {service.description}
                  </p>
                </div>
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 brand-gradient opacity-0 group-hover:opacity-8 rounded-bl-3xl transition-opacity duration-300" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
