import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, MessageSquare, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Review } from "../../backend.d";
import { useGetReviews, useSubmitReview } from "../../hooks/useQueries";

function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} transition-colors ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-white/20"
          }`}
        />
      ))}
    </div>
  );
}

function InteractiveStarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      className="flex items-center gap-1"
      aria-label="Rating"
      data-ocid="reviews.rating.select"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-pressed={value === star}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          <Star
            className={`w-7 h-7 transition-all duration-150 ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400 scale-110"
                : "fill-transparent text-white/30 hover:text-white/50"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-amber-400 text-sm font-medium ml-1">
          {["", "Poor", "Fair", "Good", "Great", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

function ReviewCard({ review, idx }: { review: Review; idx: number }) {
  const date = (() => {
    try {
      const ms = Number(review.timestamp / 1_000_000n);
      return new Date(ms).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  })();

  const initials = review.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      data-ocid={`reviews.item.${idx + 1}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: idx * 0.07 }}
      className="rounded-2xl p-6 border border-white/8 card-hover flex flex-col gap-4"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      {/* Stars */}
      <StarRating rating={Number(review.rating)} size="md" />

      {/* Message */}
      <p className="text-white/60 text-sm leading-relaxed flex-1">
        "{review.message}"
      </p>

      {/* Reviewer info */}
      <div className="flex items-center gap-3 pt-2 border-t border-white/8">
        <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-white/90 font-semibold text-sm">{review.name}</p>
          <p className="text-white/35 text-xs">{date}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ReviewForm() {
  const submitReview = useSubmitReview();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    rating?: string;
    message?: string;
  }>({});
  const [showForm, setShowForm] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!rating || rating < 1 || rating > 5)
      e.rating = "Please select a rating";
    if (!message.trim() || message.trim().length < 10)
      e.message = "Review must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await submitReview.mutateAsync({
        name: name.trim(),
        rating: BigInt(rating),
        message: message.trim(),
      });
      toast.success("Thank you for your review! 🎉");
      setName("");
      setRating(0);
      setMessage("");
      setErrors({});
      setShowForm(false);
    } catch {
      toast.error("Failed to submit review. Please try again.");
    }
  };

  const inputClass =
    "bg-white/5 border-white/12 text-white placeholder:text-white/30 h-11 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl";

  return (
    <div className="mt-12">
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center"
          >
            <button
              type="button"
              data-ocid="reviews.submit_button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2.5 px-8 py-4 brand-gradient rounded-full text-white font-bold text-base hover:scale-105 transition-all duration-300 shadow-fire"
            >
              <Star className="w-5 h-5" />
              Write a Review
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl p-6 sm:p-8 border border-white/10 shadow-card max-w-xl mx-auto"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <h3 className="font-display font-bold text-white text-lg mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Share Your Experience
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-white/70 text-sm font-medium">
                  Your Name *
                </Label>
                <Input
                  data-ocid="reviews.name.input"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="e.g. Ravi Kumar"
                  className={`${inputClass} ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-white/70 text-sm font-medium">
                  Rating *
                </Label>
                <InteractiveStarRating
                  value={rating}
                  onChange={(v) => {
                    setRating(v);
                    setErrors((p) => ({ ...p, rating: undefined }));
                  }}
                />
                {errors.rating && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.rating}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-white/70 text-sm font-medium">
                  Your Review *
                </Label>
                <Textarea
                  data-ocid="reviews.message.textarea"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setErrors((p) => ({ ...p, message: undefined }));
                  }}
                  placeholder="Tell others about your printing experience with us..."
                  rows={4}
                  className={`bg-white/5 border-white/12 text-white placeholder:text-white/30 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl resize-none ${errors.message ? "border-red-400" : ""}`}
                />
                <div className="flex items-center justify-between">
                  {errors.message ? (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={`text-xs ml-auto ${message.length < 10 ? "text-white/30" : "text-amber-400"}`}
                  >
                    {message.length} chars
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                  className="flex-1 h-11 border-white/15 text-white/60 hover:bg-white/8 hover:text-white/80 rounded-xl bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-ocid="reviews.submit_button"
                  disabled={submitReview.isPending}
                  className="flex-1 h-11 brand-gradient text-white font-bold rounded-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:scale-100 gap-2 border-0"
                >
                  {submitReview.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReviewsSection() {
  const { data: reviews, isLoading, isError } = useGetReviews();

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : 0;

  return (
    <section
      id="reviews"
      data-ocid="reviews.section"
      className="relative py-24 px-4 sm:px-6 overflow-hidden"
    >
      {/* Subtle brand glow */}
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-08 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(131,58,180,0.15) 0%, rgba(225,48,108,0.10) 50%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/12 shadow-xs text-sm font-medium mb-6 text-white/70"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <MessageSquare className="w-4 h-4" />
            Customer Reviews
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-white mb-4">
            What Our <span className="brand-gradient-text">Customers Say</span>
          </h2>
          {reviews && reviews.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <StarRating rating={Math.round(avgRating)} size="lg" />
              <span className="text-white font-bold text-2xl">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-white/35 text-sm">
                ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}
          <div className="section-divider mt-6" />
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div
            data-ocid="reviews.loading_state"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-52 w-full rounded-2xl bg-white/5"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div
            data-ocid="reviews.error_state"
            className="flex items-center gap-3 p-5 rounded-2xl border border-red-500/20 text-red-400 max-w-md mx-auto"
            style={{ background: "rgba(255,0,0,0.06)" }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Failed to load reviews. Please refresh.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && (!reviews || reviews.length === 0) && (
          <div
            data-ocid="reviews.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center rounded-2xl mb-8 border border-white/8"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-center gap-0.5 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-8 h-8 text-white/15 fill-transparent"
                />
              ))}
            </div>
            <p className="text-white/80 font-semibold mb-1">No reviews yet</p>
            <p className="text-white/35 text-sm">
              Be the first to share your experience!
            </p>
          </div>
        )}

        {/* Reviews grid */}
        {!isLoading && !isError && reviews && reviews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, idx) => (
              <ReviewCard key={String(review.id)} review={review} idx={idx} />
            ))}
          </div>
        )}

        {/* Review form */}
        {!isError && <ReviewForm />}
      </div>
    </section>
  );
}
