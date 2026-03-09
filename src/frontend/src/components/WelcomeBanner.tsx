import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Gift, Palette, Printer, Star, Truck, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useGetPromoSettings } from "../hooks/useQueries";

interface WelcomeBannerProps {
  onClose?: () => void;
}

export default function WelcomeBanner({ onClose }: WelcomeBannerProps) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const queryClient = useQueryClient();
  const { data: promoData, isLoading: promoLoading } = useGetPromoSettings();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ name: string }>).detail;
      setCustomerName(detail.name);
      setOpen(true);
    };
    window.addEventListener("customer-logged-in", handler);
    return () => window.removeEventListener("customer-logged-in", handler);
  }, []);

  // Re-fetch promo data when admin saves new promo
  useEffect(() => {
    const handlePromoUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["promoSettings"] });
    };
    window.addEventListener("promo-updated", handlePromoUpdated);
    return () =>
      window.removeEventListener("promo-updated", handlePromoUpdated);
  }, [queryClient]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const scrollTo = (id: string) => {
    handleClose();
    setTimeout(() => {
      document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  // Derived promo values with safe fallbacks
  const offerTitle = promoData?.offerTitle || "🎁 Special Offer For You";
  const offerDescription =
    promoData?.offerDescription ||
    "Get 10% OFF on your first order! Premium business cards, banners, t-shirts, packaging & more — all under one roof. Nellore's most trusted printing studio since 2012.";
  const discountCode = promoData?.discountCode || "WELCOME10";
  const isPromoActive = promoData === undefined || promoData.isActive;

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            data-ocid="welcome.dialog"
            className="max-w-lg w-full p-0 overflow-hidden border-[#833ab4]/30 shadow-2xl rounded-2xl"
            style={{ background: "rgba(10,5,20,0.98)", fontFamily: "inherit" }}
          >
            {/* Instagram gradient top bar */}
            <div
              className="h-2 w-full"
              style={{
                background:
                  "linear-gradient(90deg, #833ab4 0%, #e1306c 40%, #fd1d1d 65%, #f56040 80%, #fcb045 100%)",
              }}
            />

            {/* Close button */}
            <button
              type="button"
              data-ocid="welcome.close_button"
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center border border-white/15 transition-colors duration-200 hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.05)" }}
              aria-label="Close welcome banner"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>

            {/* Content */}
            <div className="px-6 pt-4 pb-6 space-y-5">
              {/* Header area with printing icon */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col items-center text-center"
              >
                {/* Animated printer icon ring */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg brand-gradient">
                  <Printer className="w-8 h-8 text-white" />
                </div>

                {/* Personalized greeting */}
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                  Welcome,{" "}
                  <span className="brand-gradient-text">{customerName}!</span>{" "}
                  🎉
                </h2>
                <p className="text-white/45 text-sm mt-1.5">
                  We're thrilled to have you at{" "}
                  <span className="font-semibold text-white/70">
                    Nellore Print Hub
                  </span>
                  !
                </p>
              </motion.div>

              {/* Promo block — only shown if promo is active */}
              {isPromoActive && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="rounded-xl overflow-hidden border border-[#833ab4]/25"
                  style={{ background: "rgba(131,58,180,0.10)" }}
                >
                  {/* Instagram gradient bar inside promo */}
                  <div
                    className="h-1 w-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #833ab4 0%, #e1306c 40%, #fcb045 100%)",
                    }}
                  />
                  <div className="p-4">
                    {promoLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-white/10 rounded" />
                        <Skeleton className="h-3 w-full bg-white/10 rounded" />
                        <Skeleton className="h-3 w-5/6 bg-white/10 rounded" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 brand-gradient">
                            <Gift className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white/90 text-sm mb-1">
                              {offerTitle}
                            </h3>
                            <p className="text-white/55 text-xs leading-relaxed">
                              {offerDescription}
                            </p>
                          </div>
                        </div>

                        {/* Promo code pill */}
                        {discountCode && (
                          <div className="mt-3 flex justify-center">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-sm brand-gradient text-white">
                              <Star className="w-3 h-3" />✨ Use code:{" "}
                              {discountCode}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Trust badges row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="grid grid-cols-3 gap-2"
              >
                {[
                  {
                    icon: Truck,
                    label: "Same-Day Delivery",
                    color: "#fcb045",
                    bg: "rgba(252,176,69,0.12)",
                  },
                  {
                    icon: Palette,
                    label: "Expert Design Team",
                    color: "#e1306c",
                    bg: "rgba(225,48,108,0.12)",
                  },
                  {
                    icon: Users,
                    label: "10,000+ Happy Clients",
                    color: "#833ab4",
                    bg: "rgba(131,58,180,0.12)",
                  },
                ].map(({ icon: Icon, label, color, bg }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center p-2.5 rounded-xl border border-white/8"
                    style={{ background: bg }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5"
                      style={{ background: `${color}25`, color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white/70 text-[10px] font-semibold leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <Button
                  data-ocid="welcome.cta_button"
                  onClick={() => scrollTo("#quote")}
                  className="flex-1 h-11 font-bold text-sm rounded-xl text-white border-0 hover:scale-[1.02] transition-transform duration-200 shadow-md brand-gradient"
                >
                  🎯 Get My Free Quote
                </Button>
                <Button
                  data-ocid="welcome.secondary_button"
                  variant="outline"
                  onClick={() => scrollTo("#services")}
                  className="flex-1 h-11 font-medium text-sm rounded-xl border-white/15 text-white/70 hover:bg-white/8 hover:scale-[1.01] transition-transform duration-200 bg-transparent"
                >
                  Explore Services →
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
