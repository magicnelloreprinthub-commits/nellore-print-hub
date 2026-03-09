import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useGetSiteSettings } from "../../hooks/useQueries";
import { useLang } from "../../lib/i18n";

export default function WhatsAppButton() {
  const { t } = useLang();
  const { data: settings } = useGetSiteSettings();
  const whatsapp = settings?.whatsapp ?? "919390535070";

  return (
    <motion.a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      data-ocid="whatsapp.button"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-shadow duration-300"
      style={{ backgroundColor: "#25d366" }}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 fill-white" />
      <span className="hidden sm:inline">{t.whatsapp}</span>
    </motion.a>
  );
}
