import { Clock, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const DEFAULT_HEADLINE = "Nellore's Most Trusted Printing Studio";
const DEFAULT_DESC =
  "At Magic Advertising, we don't just print — we craft your brand's first impression. From crisp business cards to eye-catching flex banners, every job is handled with care, precision, and passion. Trusted by businesses across Nellore for over a decade.";

const stats = [
  {
    icon: Clock,
    label: "12+ Years Experience",
    colorText: "text-[#833ab4]",
    bg: "rgba(131,58,180,0.08)",
    border: "rgba(131,58,180,0.22)",
  },
  {
    icon: Users,
    label: "10,000+ Happy Clients",
    colorText: "text-[#e1306c]",
    bg: "rgba(225,48,108,0.08)",
    border: "rgba(225,48,108,0.22)",
  },
  {
    icon: Zap,
    label: "Same-Day Delivery Available",
    colorText: "text-[#fcb045]",
    bg: "rgba(252,176,69,0.08)",
    border: "rgba(252,176,69,0.22)",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function IntroSection() {
  const [headline, setHeadline] = useState(
    () => localStorage.getItem("nph_intro_headline") || DEFAULT_HEADLINE,
  );
  const [desc, setDesc] = useState(
    () => localStorage.getItem("nph_intro_desc") || DEFAULT_DESC,
  );

  // Listen for storage changes (admin panel updates)
  useEffect(() => {
    const handleStorage = () => {
      setHeadline(
        localStorage.getItem("nph_intro_headline") || DEFAULT_HEADLINE,
      );
      setDesc(localStorage.getItem("nph_intro_desc") || DEFAULT_DESC);
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("intro-updated", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("intro-updated", handleStorage);
    };
  }, []);

  return (
    <section
      id="about"
      className="py-16 px-6 relative overflow-hidden"
      aria-label="About Magic Advertising"
    >
      {/* Subtle brand background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(131,58,180,0.04) 0%, rgba(225,48,108,0.02) 50%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="text-center"
        >
          {/* Main headline */}
          <motion.h2
            variants={itemVariants}
            className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-foreground leading-tight mb-6"
          >
            {headline.includes("Trusted") ? (
              <>
                {headline.split("Trusted")[0]}
                <span className="brand-gradient-text">Trusted</span>
                {headline.split("Trusted")[1]}
              </>
            ) : (
              <span className="brand-gradient-text">{headline}</span>
            )}
          </motion.h2>

          {/* Description paragraph */}
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10"
          >
            At <strong className="text-foreground">Magic Advertising</strong>,{" "}
            {desc.replace(/^At Magic Advertising,?\s*/i, "")}
          </motion.p>

          {/* Stat badge chips */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border"
                  style={{
                    background: stat.bg,
                    borderColor: stat.border,
                  }}
                >
                  <Icon className={`w-4 h-4 ${stat.colorText} flex-shrink-0`} />
                  <span className="text-sm font-semibold text-white/85 whitespace-nowrap">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </motion.div>

          {/* Ornamental divider */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3"
          >
            <div
              className="h-px w-16"
              style={{
                background: "linear-gradient(90deg, transparent, #833ab4)",
              }}
            />
            <div className="w-2 h-2 rounded-full brand-gradient" />
            <div
              className="rounded-full"
              style={{
                height: "2px",
                width: "96px",
                background:
                  "linear-gradient(90deg, #833ab4, #e1306c, #fd1d1d, #fcb045)",
                opacity: 0.7,
              }}
            />
            <div className="w-2 h-2 rounded-full brand-gradient" />
            <div
              className="h-px w-16"
              style={{
                background: "linear-gradient(90deg, #fcb045, transparent)",
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
