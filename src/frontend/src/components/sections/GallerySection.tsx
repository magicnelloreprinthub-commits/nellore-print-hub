import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useGetPhotos } from "../../hooks/useQueries";
import { useLang } from "../../lib/i18n";

const STATIC_GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop",
    alt: "Premium business cards & stationery printing",
  },
  {
    src: "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=600&h=400&fit=crop",
    alt: "Professional print shop & press machine",
  },
  {
    src: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=400&fit=crop",
    alt: "Graphic design & branding materials",
  },
  {
    src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    alt: "Custom die-cut sticker printing",
  },
  {
    src: "https://images.unsplash.com/photo-1527443224154-c4a573d5f5ec?w=600&h=400&fit=crop",
    alt: "T-shirt and apparel printing",
  },
  {
    src: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=400&fit=crop",
    alt: "Custom packaging boxes & product printing",
  },
];

interface GalleryItem {
  src: string;
  alt: string;
}

function Lightbox({
  items,
  initialIdx,
  open,
  onOpenChange,
}: {
  items: GalleryItem[];
  initialIdx: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);

  // Reset index when opened
  useEffect(() => {
    if (open) setCurrentIdx(initialIdx);
  }, [open, initialIdx]);

  const goPrev = useCallback(() => {
    setCurrentIdx((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const goNext = useCallback(() => {
    setCurrentIdx((i) => (i + 1) % items.length);
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, goPrev, goNext, onOpenChange]);

  const current = items[currentIdx];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="gallery.lightbox.dialog"
        className="max-w-4xl w-full p-0 border-0 bg-transparent shadow-none overflow-visible"
        style={{ background: "transparent" }}
      >
        <div
          className="relative flex flex-col items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onOpenChange(false);
          }}
          role="presentation"
        >
          {/* Close button */}
          <button
            type="button"
            data-ocid="gallery.lightbox.close_button"
            onClick={() => onOpenChange(false)}
            className="absolute -top-12 right-0 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image container */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIdx}
                src={current?.src}
                alt={current?.alt}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.25 }}
                className="w-full max-h-[75vh] object-contain"
              />
            </AnimatePresence>

            {/* Prev arrow */}
            {items.length > 1 && (
              <button
                type="button"
                data-ocid="gallery.lightbox.pagination_prev"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next arrow */}
            {items.length > 1 && (
              <button
                type="button"
                data-ocid="gallery.lightbox.pagination_next"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Caption + counter */}
          <div className="mt-3 flex items-center justify-between w-full px-1">
            <p className="text-white/80 text-sm font-medium truncate flex-1">
              {current?.alt}
            </p>
            <span className="text-white/40 text-xs font-mono flex-shrink-0 ml-4">
              {currentIdx + 1} / {items.length}
            </span>
          </div>

          {/* Dot navigation */}
          {items.length > 1 && (
            <div className="flex items-center gap-1.5 mt-3">
              {items.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentIdx
                      ? "w-5 h-2 brand-gradient"
                      : "w-2 h-2 bg-white/25 hover:bg-white/40"
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GallerySection() {
  const { t } = useLang();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const { data: photos, isLoading } = useGetPhotos();

  // Sort by order ascending, then by id ascending
  const sortedPhotos = [...(photos ?? [])].sort((a, b) => {
    const orderDiff = Number(a.order - b.order);
    if (orderDiff !== 0) return orderDiff;
    return Number(a.id - b.id);
  });

  // Use dynamic photos if available, fall back to static
  const galleryItems: GalleryItem[] =
    sortedPhotos.length > 0
      ? sortedPhotos.map((p) => ({
          src: p.blob.getDirectURL(),
          alt: p.title,
        }))
      : STATIC_GALLERY;

  const handleImageClick = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  return (
    <section id="gallery" className="py-24 px-6 relative">
      {/* Subtle brand glow */}
      <div
        className="absolute top-1/2 right-0 w-64 h-64 rounded-full blur-3xl opacity-08 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(232,144,26,0.15), transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase brand-gradient text-white mb-4">
            {t.gallery.badge}
          </span>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-white mb-4">
            {t.gallery.heading}
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            {t.gallery.subtitle}
          </p>
        </motion.div>

        {/* Loading skeleton */}
        {isLoading && (
          <div
            data-ocid="gallery.loading_state"
            className="grid grid-cols-2 sm:grid-cols-3 gap-5"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton
                key={i}
                className="w-full aspect-[3/2] rounded-2xl bg-white/5"
              />
            ))}
          </div>
        )}

        {/* Gallery grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {galleryItems.map((item, idx) => (
              <motion.button
                key={item.src}
                type="button"
                data-ocid={`gallery.item.${idx + 1}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="relative group rounded-2xl overflow-hidden cursor-zoom-in aspect-[3/2] border border-white/8 shadow-card text-left"
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onClick={() => handleImageClick(idx)}
                aria-label={`View ${item.alt} full size`}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    activeIdx === idx ? "scale-110" : "scale-100"
                  }`}
                />
                {/* Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
                    activeIdx === idx
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                />
                {/* Label */}
                <div
                  className={`absolute bottom-0 left-0 right-0 p-4 transform transition-all duration-300 ${
                    activeIdx === idx
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-white text-sm">
                      {item.alt}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
                {/* Brand gradient border on hover */}
                <div
                  className="absolute inset-0 rounded-2xl border-2 transition-all duration-300"
                  style={{
                    borderColor:
                      activeIdx === idx
                        ? "rgba(192,40,106,0.5)"
                        : "transparent",
                  }}
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        items={galleryItems}
        initialIdx={lightboxIdx}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </section>
  );
}
