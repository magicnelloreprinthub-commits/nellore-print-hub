import { ChevronDown, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useLang } from "../../lib/i18n";

export default function HeroSection() {
  const { t } = useLang();

  const scrollToQuote = () => {
    document.querySelector("#quote")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToServices = () => {
    document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleShare = async () => {
    const shareData = {
      title: "Nellore Print Hub",
      text: "Check out Nellore Print Hub – Premium Printing in Nellore! 🖨️",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Thanks for sharing!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Couldn't share right now. Try copying the URL manually.");
      }
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/assets/generated/cmyk-hero-bg.dim_1920x1080.jpg')",
        }}
      />
      {/* Dark overlay — deep black tint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(10,5,20,0.88) 50%, rgba(0,0,0,0.92) 100%)",
        }}
      />
      {/* Brand gradient stripe at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{
          background:
            "linear-gradient(90deg, #833ab4, #e1306c, #fd1d1d, #f56040, #fcb045)",
        }}
      />
      {/* Bottom gradient fade to background */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
      {/* Subtle Instagram brand glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(131,58,180,0.25) 0%, rgba(225,48,108,0.20) 40%, rgba(252,176,69,0.08) 70%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-white/15 text-white/80 shadow-xs"
          style={{ background: "rgba(131,58,180,0.15)" }}
        >
          <span className="w-2 h-2 rounded-full brand-gradient animate-pulse" />
          {t.hero.badge}
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight mb-6"
          style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}
        >
          {t.hero.title1}{" "}
          <span className="brand-gradient-text">{t.hero.title2}</span>
          <br />
          {t.hero.title3}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* Unified 3-Button CTA Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap gap-3 justify-center items-center"
        >
          {/* Start Your Order — primary filled */}
          <button
            type="button"
            data-ocid="hero.primary_button"
            onClick={scrollToQuote}
            className="group inline-flex items-center gap-2.5 px-8 py-4 brand-gradient rounded-full text-white font-bold text-base hover:scale-105 transition-all duration-300 shadow-fire"
          >
            {t.hero.cta}
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </button>

          {/* View Services — outlined */}
          <button
            type="button"
            data-ocid="hero.secondary_button"
            onClick={scrollToServices}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/25 text-white/85 font-medium text-base hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
          >
            {t.hero.viewServices}
          </button>

          {/* Share this site — ghost */}
          <button
            type="button"
            data-ocid="hero.share_button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-white/15 text-white/60 font-medium text-base hover:bg-white/10 hover:border-white/25 hover:text-white/85 transition-all duration-300 backdrop-blur-sm"
          >
            <Share2 className="w-4 h-4" />
            Share this site
          </button>
        </motion.div>

        {/* Decorative section divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="section-divider mt-10"
        />
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 animate-bounce"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}
