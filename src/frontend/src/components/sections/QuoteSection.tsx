import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BadgeIndianRupee,
  Brush,
  CheckCircle2,
  Download,
  Loader2,
  Paperclip,
  Printer,
  Send,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ServiceType,
  useSubmitQuote,
  useUploadFileAndGetUrl,
} from "../../hooks/useQueries";
import { useLang } from "../../lib/i18n";

const SERVICE_VALUES = [
  ServiceType.digitalPrinting,
  ServiceType.flexBanner,
  ServiceType.stickerPrinting,
  ServiceType.tShirtPrinting,
];

const SERVICE_LABELS: Record<string, string> = {
  [ServiceType.digitalPrinting]: "Digital Printing",
  [ServiceType.flexBanner]: "Flex Banner",
  [ServiceType.stickerPrinting]: "Sticker Printing",
  [ServiceType.tShirtPrinting]: "T-Shirt Printing",
};

const FEATURE_ICONS = [Zap, Brush, BadgeIndianRupee];

interface QuoteData {
  name: string;
  mobile: string;
  service: ServiceType;
  details: string;
  submittedAt: string;
}

function QuotePrintArea({ quote }: { quote: QuoteData }) {
  return (
    <div
      id="quote-print-area"
      className="rounded-2xl border border-white/12 p-6 mt-6 shadow-card"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center"
              aria-hidden="true"
            >
              <Printer className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-display font-black text-lg text-white">
              Nellore Print Hub
            </h3>
          </div>
          <p className="text-xs text-white/35">
            Magic Advertising · Dargamitta, Nellore
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-white/35 uppercase tracking-wider">
            Quote Request
          </span>
          <p className="text-xs text-white/35 mt-0.5">{quote.submittedAt}</p>
        </div>
      </div>

      {/* Details table */}
      <div className="space-y-3 mb-6">
        {[
          { label: "Customer Name", value: quote.name },
          { label: "Mobile Number", value: quote.mobile },
          {
            label: "Service Type",
            value: SERVICE_LABELS[quote.service] ?? quote.service,
          },
          { label: "Project Details", value: quote.details },
        ].map(({ label, value }) => (
          <div key={label} className="flex gap-3">
            <span className="text-xs font-semibold text-white/35 uppercase tracking-wider w-32 flex-shrink-0 pt-0.5">
              {label}
            </span>
            <span className="text-sm text-white/80 font-medium flex-1">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div
        className="rounded-xl p-3 text-xs text-white/50 border border-white/8"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <strong className="text-white/70">Note:</strong> This is a quote request
        confirmation. Our team will contact you within 24 hours. For urgent
        orders, call{" "}
        <a
          href="tel:+919390535070"
          className="font-medium"
          style={{ color: "#e1306c" }}
        >
          +91 93905 35070
        </a>
        .
      </div>

      {/* Print action buttons (hidden when printing) */}
      <div className="flex gap-3 mt-5 print:hidden">
        <button
          type="button"
          data-ocid="quote.print_button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 brand-gradient text-white font-bold text-sm rounded-xl hover:scale-[1.02] transition-all duration-200"
        >
          <Printer className="w-4 h-4" />
          Print Quote
        </button>
        <button
          type="button"
          data-ocid="quote.download_button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl hover:scale-[1.02] transition-all duration-200 border border-white/15 text-white/70 hover:bg-white/8"
        >
          <Download className="w-4 h-4" />
          Download as PDF
        </button>
      </div>
    </div>
  );
}

export default function QuoteSection() {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [service, setService] = useState<ServiceType>(
    ServiceType.digitalPrinting,
  );
  const [details, setDetails] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachUploadProgress, setAttachUploadProgress] = useState(0);
  const [attachUploading, setAttachUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<QuoteData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: submitQuote, isPending: isSubmitting } =
    useSubmitQuote();
  const uploadFile = useUploadFileAndGetUrl();

  const SERVICE_OPTIONS = t.quote.services.map((label, i) => ({
    label,
    value: SERVICE_VALUES[i],
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPending = isSubmitting || attachUploading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !details.trim()) {
      toast.error(t.quote.errorRequired);
      return;
    }

    const quoteSnapshot: QuoteData = {
      name: name.trim(),
      mobile: mobile.trim(),
      service,
      details: details.trim(),
      submittedAt: new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    };

    try {
      let attachmentUrl: string | null = null;

      // Upload attachment first if one is selected
      if (attachedFile) {
        setAttachUploading(true);
        setAttachUploadProgress(0);
        try {
          const arrayBuffer = await attachedFile.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
          const result = await uploadFile.mutateAsync({
            bytes,
            title: `quote_attachment_${Date.now()}_${attachedFile.name}`,
            order: 0n,
            fileType: "attachment",
            onProgress: (pct) => setAttachUploadProgress(pct),
          });
          attachmentUrl = result.directUrl;
        } catch {
          toast.error("Failed to upload attachment. Please try again.");
          setAttachUploading(false);
          return;
        } finally {
          setAttachUploading(false);
          setAttachUploadProgress(0);
        }
      }

      await submitQuote({
        name: quoteSnapshot.name,
        mobile: quoteSnapshot.mobile,
        service: quoteSnapshot.service,
        details: quoteSnapshot.details,
        attachmentUrl,
      });
      setSubmitted(true);
      setSubmittedQuote(quoteSnapshot);
      toast.success(t.quote.successToast);
      setName("");
      setMobile("");
      setService(ServiceType.digitalPrinting);
      setDetails("");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error(t.quote.errorFailed);
    }
  };

  const inputClass =
    "bg-white/5 border-white/12 text-white placeholder:text-white/30 h-11 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl";

  return (
    <section id="quote" className="py-24 px-6 relative">
      {/* Background decoration */}
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-05 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(225,48,108,0.25), transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: info panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-28"
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase brand-gradient text-white mb-4">
              {t.quote.badge}
            </span>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-white mb-6 leading-tight">
              {t.quote.heading1}
              <br />
              <span className="brand-gradient-text">{t.quote.heading2}</span>
            </h2>
            <p className="text-white/45 text-lg mb-8 leading-relaxed">
              {t.quote.subtitle}
            </p>

            <div className="space-y-4">
              {t.quote.features.map((item, i) => {
                const FeatureIcon = FEATURE_ICONS[i];
                return (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center flex-shrink-0">
                      <FeatureIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {item.title}
                      </div>
                      <div className="text-white/45 text-sm">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <form
              onSubmit={handleSubmit}
              className="india-border rounded-2xl p-8 space-y-5 shadow-card"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {/* Success state */}
              {submitted && (
                <motion.div
                  data-ocid="quote.success_state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 text-emerald-400"
                  style={{ background: "rgba(16,185,129,0.08)" }}
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {t.quote.successMsg}
                  </span>
                </motion.div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="quote-name"
                  className="text-white/70 text-sm font-medium"
                >
                  {t.quote.form.name}{" "}
                  <span className="text-white/35">{t.quote.form.required}</span>
                </Label>
                <Input
                  id="quote-name"
                  type="text"
                  data-ocid="quote.input"
                  placeholder={t.quote.form.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <Label
                  htmlFor="quote-mobile"
                  className="text-white/70 text-sm font-medium"
                >
                  {t.quote.form.mobile}{" "}
                  <span className="text-white/35">{t.quote.form.required}</span>
                </Label>
                <Input
                  id="quote-mobile"
                  type="tel"
                  data-ocid="quote.mobile_input"
                  placeholder={t.quote.form.mobilePlaceholder}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              {/* Service */}
              <div className="space-y-2">
                <Label className="text-white/70 text-sm font-medium">
                  {t.quote.form.service}{" "}
                  <span className="text-white/35">{t.quote.form.required}</span>
                </Label>
                <Select
                  value={service}
                  onValueChange={(val) => setService(val as ServiceType)}
                >
                  <SelectTrigger
                    data-ocid="quote.select"
                    className="bg-white/5 border-white/12 text-white focus:border-[#e1306c]/50 h-11"
                  >
                    <SelectValue
                      placeholder={t.quote.form.servicePlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent
                    className="border-white/12"
                    style={{ background: "rgba(10,5,15,0.97)" }}
                  >
                    {SERVICE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-white/80 hover:bg-white/8 focus:bg-white/8"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Details */}
              <div className="space-y-2">
                <Label
                  htmlFor="quote-details"
                  className="text-white/70 text-sm font-medium"
                >
                  {t.quote.form.details}{" "}
                  <span className="text-white/35">{t.quote.form.required}</span>
                </Label>
                <Textarea
                  id="quote-details"
                  data-ocid="quote.textarea"
                  placeholder={t.quote.form.detailsPlaceholder}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  required
                  rows={4}
                  className="bg-white/5 border-white/12 text-white placeholder:text-white/30 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 resize-none rounded-xl"
                />
              </div>

              {/* File Upload — any file type */}
              <div className="space-y-2">
                <Label className="text-white/70 text-sm font-medium">
                  {t.quote.form.fileLabel}{" "}
                  <span className="text-white/30 font-normal">
                    {t.quote.form.fileOptional}
                  </span>
                </Label>

                {attachedFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#e1306c]/25 bg-[#e1306c]/6">
                    <Paperclip className="w-4 h-4 text-[#fcb045] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-medium truncate">
                        {attachedFile.name}
                      </p>
                      <p className="text-white/40 text-xs">
                        {(attachedFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-white/40 hover:text-red-400 transition-colors flex-shrink-0"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="relative cursor-pointer w-full text-left"
                    onClick={() => fileInputRef.current?.click()}
                    data-ocid="quote.upload_button"
                  >
                    <div
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-white/12 border-dashed hover:border-white/25 transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <Upload className="w-5 h-5 text-white/30 flex-shrink-0" />
                      <span className="text-sm text-white/40">
                        {t.quote.form.fileUpload} — any file type accepted
                      </span>
                    </div>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  data-ocid="quote.dropzone"
                  accept="*"
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-label="Upload design file"
                />

                {/* Attachment upload progress */}
                {attachUploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Uploading attachment…</span>
                      <span>{Math.round(attachUploadProgress)}%</span>
                    </div>
                    <Progress
                      value={attachUploadProgress}
                      className="h-1.5 bg-white/10 [&>div]:bg-[#e1306c]"
                    />
                  </div>
                )}
              </div>

              {/* Loading state */}
              {isSubmitting && (
                <div
                  data-ocid="quote.loading_state"
                  className="flex items-center gap-2 text-white/50 text-sm"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.quote.submittingMsg}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                data-ocid="quote.submit_button"
                disabled={isPending}
                className="w-full h-12 brand-gradient text-white font-bold text-base rounded-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:scale-100 border-0"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {attachUploading
                      ? `Uploading file… ${Math.round(attachUploadProgress)}%`
                      : t.quote.form.submitting}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t.quote.form.submit}
                  </>
                )}
              </Button>
            </form>

            {/* Printable Quote Summary — shown after successful submission */}
            {submitted && submittedQuote && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <QuotePrintArea quote={submittedQuote} />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
