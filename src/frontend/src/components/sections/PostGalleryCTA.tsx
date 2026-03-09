import { Share2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export default function PostGalleryCTA() {
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
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="py-16 px-6 relative overflow-hidden"
    >
      <div className="relative max-w-5xl mx-auto">
        <div
          className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, #833ab4 0%, #e1306c 40%, #fd1d1d 65%, #f56040 80%, #fcb045 100%)",
          }}
        >
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 rounded-3xl opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px, 10px 10px",
            }}
          />
          {/* White highlight glow top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: "rgba(255,255,255,0.6)" }}
          />

          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white mb-4 leading-tight"
            >
              Ready to start your project?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-white/75 text-lg mb-10 max-w-xl mx-auto font-medium"
            >
              Get a free quote today — same-day service available
            </motion.p>

            {/* Three action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3 justify-center items-center"
            >
              {/* Start Your Order — white filled */}
              <button
                type="button"
                data-ocid="postgallery.primary_button"
                onClick={scrollToQuote}
                className="group inline-flex items-center gap-2.5 px-8 py-4 bg-white rounded-full text-gray-900 font-bold text-base hover:scale-105 hover:bg-white/90 transition-all duration-300 shadow-lg"
              >
                Start Your Order
                <span className="group-hover:translate-x-1 transition-transform duration-200">
                  →
                </span>
              </button>

              {/* View Services — outlined white */}
              <button
                type="button"
                data-ocid="postgallery.secondary_button"
                onClick={scrollToServices}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/70 text-white font-bold text-base hover:bg-white/15 hover:border-white transition-all duration-300"
              >
                View Services
              </button>

              {/* Share this site — ghost */}
              <button
                type="button"
                data-ocid="postgallery.share_button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-white/40 text-white/85 font-medium text-base hover:bg-white/15 hover:border-white/60 hover:text-white transition-all duration-300"
              >
                <Share2 className="w-4 h-4" />
                Share this site
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
