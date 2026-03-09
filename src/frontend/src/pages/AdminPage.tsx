import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  Gift,
  HardDrive,
  Images,
  List,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Paperclip,
  Pencil,
  Phone,
  Printer,
  RefreshCw,
  Save,
  Send,
  Settings,
  Star,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import type {
  AdminMessage,
  Customer,
  Photo,
  PromoSettings,
  Quote,
  Review,
} from "../backend.d";
import {
  QuoteStatus,
  ServiceType,
  useAddPhotoWithProgress,
  useDeleteAdminMessage,
  useDeletePhoto,
  useDeleteReview,
  useGetAllAdminMessages,
  useGetAllFiles,
  useGetCustomers,
  useGetPhotos,
  useGetPromoSettings,
  useGetQuotes,
  useGetReviews,
  useGetSiteSettings,
  useSendMessageToCustomer,
  useUpdatePhotoTitle,
  useUpdatePromoSettings,
  useUpdateQuoteStatus,
  useUpdateQuoteStatusWithReason,
  useUpdateSiteSettings,
  useUploadFileAndGetUrl,
} from "../hooks/useQueries";

const ADMIN_PASSWORD = "Magic123";

const SERVICE_LABELS: Record<string, string> = {
  [ServiceType.digitalPrinting]: "Digital Printing",
  [ServiceType.flexBanner]: "Flex Banner",
  [ServiceType.stickerPrinting]: "Sticker Printing",
  [ServiceType.tShirtPrinting]: "T-Shirt Printing",
};

const SERVICE_COLORS: Record<string, string> = {
  [ServiceType.digitalPrinting]:
    "bg-[#e1306c]/12 text-[#fcb045] border-[#e1306c]/30",
  [ServiceType.flexBanner]:
    "bg-[#e1306c]/12 text-[#fcb045] border-[#e1306c]/30",
  [ServiceType.stickerPrinting]:
    "bg-[#fcb045]/12 text-[#fcb045] border-[#fcb045]/30",
  [ServiceType.tShirtPrinting]:
    "bg-[#fcb045]/12 text-[#fcb045] border-[#fcb045]/30",
};

function formatTimestamp(ts: bigint): string {
  try {
    const ms = Number(ts / 1_000_000n);
    return new Date(ms).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

// Helper: force-download via fetch
function forceDownloadFile(url: string, filename: string) {
  fetch(url)
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 100);
    })
    .catch(() => {
      window.open(url, "_blank");
    });
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);
}

// ─── Quote Status Badge ────────────────────────────────────────────────────────

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const configs: Record<
    QuoteStatus,
    { label: string; cls: string; dot: string }
  > = {
    [QuoteStatus.new_]: {
      label: "New",
      cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      dot: "bg-amber-400",
    },
    [QuoteStatus.replied]: {
      label: "Replied",
      cls: "bg-[#e1306c]/15 text-[#fcb045] border-[#e1306c]/30",
      dot: "bg-[#e1306c]",
    },
    [QuoteStatus.accepted]: {
      label: "Accepted",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    [QuoteStatus.rejected]: {
      label: "Rejected",
      cls: "bg-red-500/15 text-red-400 border-red-500/30",
      dot: "bg-red-400",
    },
  };
  const cfg = configs[status] ?? configs[QuoteStatus.new_];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Quote Row with Expandable Detail ─────────────────────────────────────────

function QuoteRow({
  quote,
  idx,
  isExpanded,
  onToggle,
}: {
  quote: Quote;
  idx: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const updateStatus = useUpdateQuoteStatus();
  const updateStatusWithReason = useUpdateQuoteStatusWithReason();
  const uploadFile = useUploadFileAndGetUrl();
  const sendMsg = useSendMessageToCustomer();
  const isNew = quote.status === QuoteStatus.new_;

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(
    () => localStorage.getItem(`nph_quote_pdf_${quote.id}`) || null,
  );
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Accept/Reject inline state
  const [actionMode, setActionMode] = useState<"accept" | "reject" | null>(
    null,
  );
  const [actionReason, setActionReason] = useState("");
  const [actionPending, setActionPending] = useState(false);

  const whatsappMsg = encodeURIComponent(
    `Hi ${quote.name}, regarding your ${SERVICE_LABELS[quote.service] ?? quote.service} quote — we're happy to assist! Please let us know your availability.`,
  );

  const handleToggleStatus = async () => {
    const newStatus = isNew ? QuoteStatus.replied : QuoteStatus.new_;
    try {
      await updateStatus.mutateAsync({ id: quote.id, status: newStatus });
      toast.success(
        `Quote marked as "${newStatus === QuoteStatus.replied ? "Replied" : "New"}"`,
      );
    } catch {
      toast.error("Failed to update status. Please try again.");
    }
  };

  const handleAcceptReject = async (
    status: QuoteStatus.accepted | QuoteStatus.rejected,
  ) => {
    setActionPending(true);
    try {
      await updateStatusWithReason.mutateAsync({
        id: quote.id,
        status,
        reason: actionReason.trim(),
      });
      // Send notification to customer inbox
      if (status === QuoteStatus.accepted) {
        await sendMsg.mutateAsync({
          toMobile: quote.mobile,
          toName: quote.name,
          subject: "Your Quote is Accepted!",
          body: `Dear ${quote.name}, great news! Your ${SERVICE_LABELS[quote.service] ?? "print"} quote request has been ACCEPTED.${actionReason.trim() ? `\n\nDetails: ${actionReason.trim()}` : ""}\n\nWe'll contact you shortly to proceed. Thank you for choosing Nellore Print Hub!`,
        });
      } else {
        await sendMsg.mutateAsync({
          toMobile: quote.mobile,
          toName: quote.name,
          subject: "Quote Update - Action Required",
          body: `Dear ${quote.name}, regarding your ${SERVICE_LABELS[quote.service] ?? "print"} quote request — we are unable to proceed at this time.${actionReason.trim() ? `\n\nReason: ${actionReason.trim()}` : ""}\n\nPlease contact us directly to discuss alternatives. Thank you — Nellore Print Hub.`,
        });
      }
      toast.success(
        status === QuoteStatus.accepted
          ? "Quote accepted & customer notified!"
          : "Quote rejected & customer notified.",
      );
      setActionMode(null);
      setActionReason("");
    } catch {
      toast.error("Failed to update status. Please try again.");
    } finally {
      setActionPending(false);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setPdfUploading(true);
    setPdfProgress(0);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
      const { directUrl } = await uploadFile.mutateAsync({
        bytes,
        title: `quotation_${quote.id}_${Date.now()}`,
        order: 999n,
        fileType: "document",
        onProgress: (pct) => setPdfProgress(pct),
      });
      // directUrl is an absolute URL from the blob storage CDN
      localStorage.setItem(`nph_quote_pdf_${quote.id}`, directUrl);
      setPdfUrl(directUrl);
      setPdfFile(null);

      // Send message to customer's website inbox with the absolute file URL
      const fileDisplayName = pdfFile.name;
      await sendMsg.mutateAsync({
        toMobile: quote.mobile,
        toName: quote.name,
        subject: `Quotation for your ${SERVICE_LABELS[quote.service] ?? "print"} request`,
        body: `Dear ${quote.name}, your quotation is ready.\n\nFILENAME:${fileDisplayName}\nFILEURL:${directUrl}`,
      });

      // Auto-mark as replied
      await updateStatus.mutateAsync({
        id: quote.id,
        status: QuoteStatus.replied,
      });

      // Open WhatsApp with pre-filled quotation message using absolute URL
      const waText = encodeURIComponent(
        `Hi ${quote.name}! 📄 Your quotation from Nellore Print Hub is ready.\n\nFile: ${fileDisplayName}\nTap to view/download:\n👉 ${directUrl}\n\nThank you — Nellore Print Hub`,
      );
      window.open(
        `https://wa.me/${quote.mobile.replace(/[^0-9]/g, "")}?text=${waText}`,
        "_blank",
      );

      toast.success(
        "Quotation sent! Customer inbox updated & WhatsApp opened.",
      );
    } catch {
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setPdfUploading(false);
      setPdfProgress(0);
    }
  };

  return (
    <>
      <TableRow
        data-ocid={`admin.row.${idx + 1}`}
        onClick={onToggle}
        className="border-white/6 hover:bg-white/4 transition-colors cursor-pointer select-none"
      >
        <TableCell className="text-muted-foreground text-sm font-mono w-10">
          {idx + 1}
        </TableCell>
        <TableCell className="text-white font-semibold">
          <div className="flex items-center gap-1.5">
            {quote.name}
            {quote.attachmentUrl && (
              <span title="Has attachment">
                <Paperclip className="w-3 h-3 text-[#fcb045]/60 flex-shrink-0" />
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <a
            href={`tel:${quote.mobile}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[#e1306c] hover:text-[#fcb045] text-sm font-medium transition-colors"
          >
            {quote.mobile}
          </a>
        </TableCell>
        <TableCell>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SERVICE_COLORS[quote.service] ?? "bg-[#e1306c]/10 text-[#fcb045] border-[#e1306c]/20"}`}
          >
            {SERVICE_LABELS[quote.service] ?? String(quote.service)}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <QuoteStatusBadge status={quote.status} />
            {(quote.status === QuoteStatus.new_ ||
              quote.status === QuoteStatus.replied) && (
              <button
                type="button"
                data-ocid={`admin.quote.status.toggle.${idx + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus();
                }}
                disabled={updateStatus.isPending}
                title={isNew ? "Mark as Replied" : "Mark as New"}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all border ${
                  isNew
                    ? "bg-[#e1306c]/15 text-[#fcb045] border-[#e1306c]/30 hover:bg-[#e1306c]/25"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                } disabled:opacity-50`}
              >
                {updateStatus.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : isNew ? (
                  "Mark Replied"
                ) : (
                  "Mark New"
                )}
              </button>
            )}
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm hidden lg:table-cell whitespace-nowrap">
          {formatTimestamp(quote.timestamp)}
        </TableCell>
        <TableCell className="w-8">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-white/40"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </TableCell>
      </TableRow>

      {/* Expandable detail row */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <TableRow className="border-none hover:bg-transparent">
            <TableCell colSpan={7} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-5 pt-2 bg-[#e1306c]/3 border-b border-[#e1306c]/10">
                  {/* Project details */}
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
                      Project Details
                    </p>
                    <p className="text-foreground text-sm leading-relaxed glass rounded-xl p-4">
                      {quote.details || (
                        <span className="text-muted-foreground italic">
                          No details provided.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Customer Attachment */}
                  {quote.attachmentUrl && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Customer Attachment
                      </p>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-[#833ab4]/30 bg-[#833ab4]/8">
                        {isImageUrl(quote.attachmentUrl) ? (
                          <img
                            src={quote.attachmentUrl}
                            alt="Customer attachment"
                            className="w-14 h-10 object-cover rounded-lg border border-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#833ab4]/20 flex items-center justify-center flex-shrink-0">
                            <Paperclip className="w-4 h-4 text-[#833ab4]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm font-medium truncate">
                            {quote.attachmentUrl
                              .split("/")
                              .pop()
                              ?.split("?")[0] || "Attachment"}
                          </p>
                          <p className="text-white/40 text-xs">
                            Customer uploaded file
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={quote.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-white/70 border-white/20 hover:bg-white/10"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open File
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin.quote.attachment.download_button.${idx + 1}`}
                            className="gap-1.5 text-white/70 border-white/20 hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              const fname =
                                quote
                                  .attachmentUrl!.split("/")
                                  .pop()
                                  ?.split("?")[0] || "attachment";
                              forceDownloadFile(quote.attachmentUrl!, fname);
                            }}
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`tel:${quote.mobile}`}
                      data-ocid={`admin.quote.call.button.${idx + 1}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-[#e1306c]/10 border-[#e1306c]/30 text-[#fcb045] hover:bg-[#e1306c]/20 hover:border-[#e1306c]/40"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call {quote.name}
                      </Button>
                    </a>

                    <a
                      href={`https://wa.me/${quote.mobile.replace(/[^0-9]/g, "")}?text=${whatsappMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid={`admin.quote.whatsapp.button.${idx + 1}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 hover:text-[#1db954] hover:border-[#25D366]/50"
                      >
                        <SiWhatsapp className="w-3.5 h-3.5" />
                        WhatsApp
                      </Button>
                    </a>

                    {(quote.status === QuoteStatus.new_ ||
                      quote.status === QuoteStatus.replied) && (
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid={`admin.quote.reply.toggle.${idx + 1}`}
                        disabled={updateStatus.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus();
                        }}
                        className={`gap-2 ${
                          isNew
                            ? "bg-[#e1306c]/10 border-[#e1306c]/30 text-[#fcb045] hover:bg-[#e1306c]/20 hover:border-[#e1306c]/40"
                            : "bg-white/8 border-white/15 text-foreground/60 hover:bg-white/12 hover:text-foreground/80"
                        }`}
                      >
                        {updateStatus.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isNew ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        {updateStatus.isPending
                          ? "Updating..."
                          : isNew
                            ? "Mark as Replied"
                            : "Mark as New"}
                      </Button>
                    )}

                    {/* Accept / Reject buttons */}
                    {quote.status !== QuoteStatus.accepted && (
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`admin.quote.accept.button.${idx + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMode(
                            actionMode === "accept" ? null : "accept",
                          );
                          setActionReason("");
                        }}
                        className="gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept
                      </Button>
                    )}
                    {quote.status !== QuoteStatus.rejected && (
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`admin.quote.reject.button.${idx + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMode(
                            actionMode === "reject" ? null : "reject",
                          );
                          setActionReason("");
                        }}
                        className="gap-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    )}
                  </div>

                  {/* Inline accept/reject reason form */}
                  <AnimatePresence>
                    {actionMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          className={`mt-3 p-4 rounded-xl border ${
                            actionMode === "accept"
                              ? "border-emerald-500/30 bg-emerald-500/6"
                              : "border-red-500/30 bg-red-500/6"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          role="presentation"
                        >
                          <p
                            className={`text-sm font-semibold mb-2 ${actionMode === "accept" ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {actionMode === "accept"
                              ? "Accept Quote"
                              : "Reject Quote"}{" "}
                            — Add reason (optional)
                          </p>
                          <textarea
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder={
                              actionMode === "accept"
                                ? "e.g. We can process this within 2 days..."
                                : "e.g. This size/type is not available currently..."
                            }
                            rows={2}
                            className="w-full bg-white/5 border border-white/12 text-white text-sm placeholder:text-white/30 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-white/25 mb-3"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              data-ocid={`admin.quote.action.confirm_button.${idx + 1}`}
                              disabled={actionPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptReject(
                                  actionMode === "accept"
                                    ? QuoteStatus.accepted
                                    : QuoteStatus.rejected,
                                );
                              }}
                              className={`gap-1.5 font-bold ${
                                actionMode === "accept"
                                  ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                                  : "bg-red-500 hover:bg-red-400 text-white"
                              }`}
                            >
                              {actionPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : actionMode === "accept" ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              {actionPending
                                ? "Sending..."
                                : actionMode === "accept"
                                  ? "Confirm Accept"
                                  : "Confirm Reject"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              data-ocid={`admin.quote.action.cancel_button.${idx + 1}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMode(null);
                                setActionReason("");
                              }}
                              className="text-white/50 hover:text-white"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Show status reason if present */}
                  {quote.statusReason && (
                    <div
                      className={`mt-3 p-3 rounded-xl border text-sm ${
                        quote.status === QuoteStatus.accepted
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                          : "border-red-500/20 bg-red-500/5 text-red-300"
                      }`}
                    >
                      <span className="font-semibold">
                        {quote.status === QuoteStatus.accepted
                          ? "Accept"
                          : "Reject"}{" "}
                        reason:{" "}
                      </span>
                      {quote.statusReason}
                    </div>
                  )}

                  {/* PDF / File Quotation Reply */}
                  <div className="mt-4 pt-4 border-t border-black/8">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      Send Quotation File
                    </p>

                    {pdfUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-[#e1306c]/10 rounded-xl border border-[#e1306c]/25">
                        <FileText className="w-5 h-5 text-[#fcb045] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[#fcb045] text-sm font-semibold">
                            Quotation file sent
                          </p>
                          <p className="text-muted-foreground text-xs truncate">
                            {pdfUrl.split("/").pop()?.split("?")[0] || pdfUrl}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-[#fcb045] border-[#e1306c]/40 hover:bg-[#e1306c]/10"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-[#fcb045] border-[#e1306c]/40 hover:bg-[#e1306c]/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              const fname =
                                pdfUrl.split("/").pop()?.split("?")[0] ||
                                "quotation";
                              forceDownloadFile(pdfUrl, fname);
                            }}
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin.quote.resend.button.${idx + 1}`}
                            className="gap-1.5 text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              const waResendText = encodeURIComponent(
                                `Hi ${quote.name}! 📄 Your quotation from Nellore Print Hub is ready.\n\nTap to view/download:\n👉 ${pdfUrl}\n\nThank you — Nellore Print Hub`,
                              );
                              window.open(
                                `https://wa.me/${quote.mobile.replace(/[^0-9]/g, "")}?text=${waResendText}`,
                                "_blank",
                              );
                            }}
                          >
                            <SiWhatsapp className="w-3.5 h-3.5" /> Re-send on
                            WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              localStorage.removeItem(
                                `nph_quote_pdf_${quote.id}`,
                              );
                              setPdfUrl(null);
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label
                          htmlFor={`pdf-input-${quote.id}`}
                          className="flex items-center gap-3 p-3 border-2 border-dashed border-black/15 hover:border-[#e1306c]/50 rounded-xl cursor-pointer transition-all bg-white/50 hover:bg-[#e1306c]/5"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <FileUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          {pdfFile ? (
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {pdfFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(pdfFile.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Upload quotation (PDF, image, or any file)
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Click to select file
                              </p>
                            </div>
                          )}
                        </label>
                        <input
                          id={`pdf-input-${quote.id}`}
                          type="file"
                          accept="*"
                          className="hidden"
                          ref={pdfInputRef}
                          onChange={(e) => {
                            e.stopPropagation();
                            const f = e.target.files?.[0];
                            if (f) setPdfFile(f);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {pdfFile && (
                          <>
                            {pdfUploading && (
                              <Progress
                                value={pdfProgress}
                                className="h-1.5 bg-black/10 [&>div]:bg-[#e1306c]"
                              />
                            )}
                            <Button
                              size="sm"
                              disabled={pdfUploading}
                              data-ocid={`admin.quote.pdf.upload_button.${idx + 1}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePdfUpload();
                              }}
                              className="gap-2 bg-[#833ab4] text-white hover:bg-[#e1306c] font-semibold rounded-lg"
                            >
                              {pdfUploading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  {Math.round(pdfProgress)}%
                                </>
                              ) : (
                                <>
                                  <FileUp className="w-3.5 h-3.5" />
                                  Send Quotation to Customer
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Quotes Panel ──────────────────────────────────────────────────────────────

type FilterType = "all" | "new" | "replied" | "accepted" | "rejected";

function QuotesPanel() {
  const { data: quotes, isLoading, isError } = useGetQuotes();
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = (quotes ?? []).filter((q) => {
    if (filter === "new") return q.status === QuoteStatus.new_;
    if (filter === "replied") return q.status === QuoteStatus.replied;
    if (filter === "accepted") return q.status === QuoteStatus.accepted;
    if (filter === "rejected") return q.status === QuoteStatus.rejected;
    return true;
  });

  const totalCount = quotes?.length ?? 0;
  const newCount =
    quotes?.filter((q) => q.status === QuoteStatus.new_).length ?? 0;
  const repliedCount =
    quotes?.filter((q) => q.status === QuoteStatus.replied).length ?? 0;
  const acceptedCount =
    quotes?.filter((q) => q.status === QuoteStatus.accepted).length ?? 0;
  const rejectedCount =
    quotes?.filter((q) => q.status === QuoteStatus.rejected).length ?? 0;

  const FILTERS: {
    key: FilterType;
    label: string;
    count: number;
    color: string;
  }[] = [
    { key: "all", label: "All", count: totalCount, color: "text-white" },
    { key: "new", label: "New", count: newCount, color: "text-amber-300" },
    {
      key: "replied",
      label: "Replied",
      count: repliedCount,
      color: "text-[#e1306c]",
    },
    {
      key: "accepted",
      label: "Accepted",
      count: acceptedCount,
      color: "text-emerald-400",
    },
    {
      key: "rejected",
      label: "Rejected",
      count: rejectedCount,
      color: "text-red-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl p-4 flex flex-col gap-1"
        >
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Total
          </span>
          <span className="font-display font-black text-3xl text-white">
            {isLoading ? (
              <Skeleton className="h-8 w-12 bg-white/5" />
            ) : (
              totalCount
            )}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 flex flex-col gap-1 border border-amber-500/20"
        >
          <span className="text-amber-400/70 text-xs uppercase tracking-wider">
            New
          </span>
          <span className="font-display font-black text-3xl text-amber-300">
            {isLoading ? (
              <Skeleton className="h-8 w-12 bg-white/5" />
            ) : (
              newCount
            )}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl p-4 flex flex-col gap-1 border border-emerald-500/20"
        >
          <span className="text-emerald-400/70 text-xs uppercase tracking-wider">
            Accepted
          </span>
          <span className="font-display font-black text-3xl text-emerald-400">
            {isLoading ? (
              <Skeleton className="h-8 w-12 bg-white/5" />
            ) : (
              acceptedCount
            )}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 flex flex-col gap-1 border border-red-500/20"
        >
          <span className="text-red-400/70 text-xs uppercase tracking-wider">
            Rejected
          </span>
          <span className="font-display font-black text-3xl text-red-400">
            {isLoading ? (
              <Skeleton className="h-8 w-12 bg-white/5" />
            ) : (
              rejectedCount
            )}
          </span>
        </motion.div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            data-ocid="admin.quotes.filter.tab"
            onClick={() => {
              setFilter(f.key);
              setExpandedId(null);
            }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              filter === f.key
                ? "brand-gradient text-white font-bold shadow-fire"
                : "glass text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {f.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === f.key ? "bg-black/20" : "bg-white/10"
              } ${f.color}`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div data-ocid="admin.loading_state" className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          data-ocid="admin.error_state"
          className="flex items-center gap-3 p-5 glass rounded-2xl border border-red-500/20 text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Failed to load quotes. Please refresh.</p>
        </div>
      )}

      {/* Table */}
      {!isLoading &&
        !isError &&
        (filtered.length === 0 ? (
          <div
            data-ocid="admin.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Printer className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-white font-semibold mb-1">No quotes found</p>
            <p className="text-muted-foreground text-sm">
              {filter === "all"
                ? "Quote submissions will appear here."
                : `No "${filter}" quotes at the moment.`}
            </p>
          </div>
        ) : (
          <div
            data-ocid="admin.table"
            className="glass rounded-2xl overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="text-white/60 font-semibold w-10">
                    #
                  </TableHead>
                  <TableHead className="text-white/60 font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="text-white/60 font-semibold">
                    Mobile
                  </TableHead>
                  <TableHead className="text-white/60 font-semibold">
                    Service
                  </TableHead>
                  <TableHead className="text-white/60 font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-white/60 font-semibold hidden lg:table-cell">
                    Date
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((quote, idx) => (
                  <QuoteRow
                    key={String(quote.id)}
                    quote={quote}
                    idx={idx}
                    isExpanded={expandedId === String(quote.id)}
                    onToggle={() =>
                      setExpandedId(
                        expandedId === String(quote.id)
                          ? null
                          : String(quote.id),
                      )
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
    </div>
  );
}

// ─── Site Settings Panel ───────────────────────────────────────────────────────

function SiteSettingsPanel() {
  const { data: settings, isLoading, isError } = useGetSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const uploadFileAndGetUrl = useUploadFileAndGetUrl();

  const [form, setForm] = useState({
    siteName: "",
    tagline: "",
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
  });

  // Logo upload state
  const [currentLogoSrc, setCurrentLogoSrc] = useState<string>(
    () =>
      settings?.logoUrl ||
      localStorage.getItem("nph_logo_url") ||
      "/assets/generated/nellore-print-hub-logo-transparent.dim_600x200.png",
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Intro text state
  const [introHeadline, setIntroHeadline] = useState(
    () => localStorage.getItem("nph_intro_headline") || "",
  );
  const [introDesc, setIntroDesc] = useState(
    () => localStorage.getItem("nph_intro_desc") || "",
  );

  // Sync form when settings load
  useEffect(() => {
    if (settings) {
      setForm({
        siteName: settings.siteName,
        tagline: settings.tagline,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        whatsapp: settings.whatsapp,
      });
      // Update logo display from settings
      if (settings.logoUrl) {
        setCurrentLogoSrc(settings.logoUrl);
      }
    }
  }, [settings]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(previewUrl);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setLogoUploading(true);
    setLogoUploadProgress(0);
    try {
      const arrayBuffer = await logoFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
      // Upload with fileType "logo" so it does NOT appear in the gallery
      const { directUrl } = await uploadFileAndGetUrl.mutateAsync({
        bytes,
        title: `logo_${Date.now()}`,
        order: 0n,
        fileType: "logo",
        onProgress: (pct) => setLogoUploadProgress(pct),
      });
      // Save to siteSettings.logoUrl so all clients see it
      const currentFormSettings = settings ?? {
        siteName: form.siteName,
        tagline: form.tagline,
        phone: form.phone,
        email: form.email,
        address: form.address,
        whatsapp: form.whatsapp,
        logoUrl: "",
      };
      await updateSettings.mutateAsync({
        ...currentFormSettings,
        siteName: form.siteName || currentFormSettings.siteName,
        tagline: form.tagline || currentFormSettings.tagline,
        phone: form.phone || currentFormSettings.phone,
        email: form.email || currentFormSettings.email,
        address: form.address || currentFormSettings.address,
        whatsapp: form.whatsapp || currentFormSettings.whatsapp,
        logoUrl: directUrl,
      });
      // Also save to localStorage as a fast local fallback
      localStorage.setItem("nph_logo_url", directUrl);
      setCurrentLogoSrc(directUrl);
      window.dispatchEvent(
        new CustomEvent("logo-updated", { detail: { url: directUrl } }),
      );
      toast.success("Logo updated successfully!");
      setLogoFile(null);
      setLogoPreviewUrl(null);
    } catch {
      toast.error("Failed to upload logo. Please try again.");
    } finally {
      setLogoUploading(false);
      setLogoUploadProgress(0);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        siteName: form.siteName,
        tagline: form.tagline,
        phone: form.phone,
        email: form.email,
        address: form.address,
        whatsapp: form.whatsapp,
        logoUrl: settings?.logoUrl ?? currentLogoSrc ?? "",
      });
      // Save intro text to localStorage
      if (introHeadline.trim()) {
        localStorage.setItem("nph_intro_headline", introHeadline.trim());
      } else {
        localStorage.removeItem("nph_intro_headline");
      }
      if (introDesc.trim()) {
        localStorage.setItem("nph_intro_desc", introDesc.trim());
      } else {
        localStorage.removeItem("nph_intro_desc");
      }
      window.dispatchEvent(new Event("intro-updated"));
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const handleField =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (isLoading) {
    return (
      <div data-ocid="admin.settings.loading_state" className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 bg-white/5" />
            <Skeleton className="h-11 w-full bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="admin.settings.error_state"
        className="flex items-center gap-3 p-5 glass rounded-2xl border border-red-500/20 text-red-400"
      >
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">Failed to load site settings. Please refresh.</p>
      </div>
    );
  }

  const inputClass =
    "bg-white/5 border-white/12 text-white placeholder:text-white/30 h-11 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl";

  return (
    <div className="space-y-8">
      {/* Business Information */}
      <div className="glass rounded-2xl p-6 space-y-6">
        <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#e1306c]" />
          Business Information
        </h3>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Site Name */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">
              Site Name
            </Label>
            <Input
              data-ocid="admin.settings.sitename.input"
              value={form.siteName}
              onChange={handleField("siteName")}
              placeholder="e.g. Nellore Print Hub"
              className={inputClass}
            />
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">Tagline</Label>
            <Input
              data-ocid="admin.settings.tagline.input"
              value={form.tagline}
              onChange={handleField("tagline")}
              placeholder="e.g. Premium Printing Solutions"
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">
              Phone Number
            </Label>
            <Input
              data-ocid="admin.settings.phone.input"
              type="tel"
              value={form.phone}
              onChange={handleField("phone")}
              placeholder="+91 99999 99999"
              className={inputClass}
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">
              WhatsApp Number
            </Label>
            <Input
              data-ocid="admin.settings.whatsapp.input"
              type="tel"
              value={form.whatsapp}
              onChange={handleField("whatsapp")}
              placeholder="919999999999 (with country code)"
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">
              Email Address
            </Label>
            <Input
              data-ocid="admin.settings.email.input"
              type="email"
              value={form.email}
              onChange={handleField("email")}
              placeholder="your@email.com"
              className={inputClass}
            />
          </div>

          {/* Address */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-white/80 text-sm font-medium">Address</Label>
            <Textarea
              data-ocid="admin.settings.address.input"
              value={form.address}
              onChange={handleField("address")}
              placeholder="Full business address"
              rows={2}
              className="bg-white/5 border-white/12 text-white placeholder:text-white/30 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl resize-none"
            />
          </div>
        </div>
      </div>

      {/* Logo Upload Section */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
          <Printer className="w-5 h-5 text-[#e1306c]" />
          Company Logo
        </h3>

        {/* Current logo preview */}
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="w-24 h-16 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
            <img
              src={currentLogoSrc}
              alt="Current logo"
              className="max-h-14 max-w-20 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/generated/nellore-print-hub-logo-transparent.dim_600x200.png";
              }}
            />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium">
              Current Active Logo
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Upload a new image below to replace it
            </p>
          </div>
        </div>

        {/* Upload zone */}
        <div className="space-y-3">
          <label
            data-ocid="admin.logo.dropzone"
            htmlFor="logo-file-input"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/15 hover:border-[#e1306c]/40 rounded-xl p-6 cursor-pointer transition-all duration-200 bg-white/3 hover:bg-white/6"
          >
            {logoFile ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-[#e1306c]" />
                <p className="text-white font-medium text-sm">
                  {logoFile.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {(logoFile.size / 1024).toFixed(0)} KB — click to change
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-white/30" />
                <p className="text-white/60 text-sm font-medium">
                  Click to upload new logo
                </p>
                <p className="text-white/30 text-xs">
                  PNG, JPG, SVG, WebP supported
                </p>
              </>
            )}
          </label>
          <input
            id="logo-file-input"
            ref={logoInputRef}
            data-ocid="admin.logo.upload_button"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoFileChange}
          />

          {/* Preview new logo */}
          {logoPreviewUrl && (
            <div className="flex items-center gap-4 p-3 bg-[#e1306c]/10 rounded-xl border border-[#e1306c]/20">
              <div className="w-20 h-14 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={logoPreviewUrl}
                  alt="New logo preview"
                  className="max-h-12 max-w-16 object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-[#fcb045] text-sm font-medium">
                  New logo ready to upload
                </p>
                <p className="text-[#e1306c]/70 text-xs">{logoFile?.name}</p>
              </div>
              <Button
                data-ocid="admin.logo.save_button"
                onClick={handleLogoUpload}
                disabled={logoUploading}
                size="sm"
                className="brand-gradient text-white font-bold rounded-xl gap-2 flex-shrink-0"
              >
                {logoUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {Math.round(logoUploadProgress)}%
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Apply Logo
                  </>
                )}
              </Button>
            </div>
          )}

          {logoUploading && (
            <Progress
              value={logoUploadProgress}
              className="h-1.5 bg-white/10 [&>div]:brand-gradient"
            />
          )}
        </div>
      </div>

      {/* Company Intro Text Section */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
          <Pencil className="w-5 h-5 text-[#e1306c]" />
          Company Intro Text
        </h3>
        <p className="text-muted-foreground text-sm">
          Edit the headline and description shown in the "About" section of the
          homepage.
        </p>

        <div className="space-y-2">
          <Label className="text-white/80 text-sm font-medium">
            Intro Headline
          </Label>
          <Input
            data-ocid="admin.settings.intro_headline.input"
            value={introHeadline}
            onChange={(e) => setIntroHeadline(e.target.value)}
            placeholder="e.g. Nellore's Most Trusted Printing Studio"
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use default headline.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80 text-sm font-medium">
            Intro Description
          </Label>
          <Textarea
            data-ocid="admin.settings.intro_desc.input"
            value={introDesc}
            onChange={(e) => setIntroDesc(e.target.value)}
            placeholder="At Magic Advertising, we don't just print — we craft your brand's first impression..."
            rows={4}
            className="bg-white/5 border-white/12 text-white placeholder:text-white/30 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use default description.
          </p>
        </div>
      </div>

      {/* Save button */}
      <Button
        data-ocid="admin.settings.save.button"
        onClick={handleSave}
        disabled={updateSettings.isPending}
        className="w-full h-12 brand-gradient text-white font-bold rounded-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-60 disabled:scale-100 text-base gap-2"
      >
        {updateSettings.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Gallery Panel ─────────────────────────────────────────────────────────────

function PhotoCard({
  photo,
  idx,
  onDelete,
}: {
  photo: Photo;
  idx: number;
  onDelete: (id: bigint) => void;
}) {
  const updateTitle = useUpdatePhotoTitle();
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(photo.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTitleSave = async () => {
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === photo.title) {
      setTitleValue(photo.title);
      setIsEditing(false);
      return;
    }
    try {
      await updateTitle.mutateAsync({ id: photo.id, newTitle: trimmed });
      toast.success("Title updated");
    } catch {
      toast.error("Failed to update title");
      setTitleValue(photo.title);
    }
    setIsEditing(false);
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-2xl overflow-hidden border border-white/8 group"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        <img
          src={photo.blob.getDirectURL()}
          alt={photo.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Delete overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <AnimatePresence>
            {confirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-lg p-1"
              >
                <span className="text-white/70 text-xs px-1">Delete?</span>
                <button
                  type="button"
                  data-ocid={`gallery.photo.delete_button.${idx + 1}`}
                  onClick={() => onDelete(photo.id)}
                  className="px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Yes
                </button>
                <button
                  type="button"
                  data-ocid={`gallery.photo.cancel_button.${idx + 1}`}
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  No
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="trash"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDelete(true)}
                className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Title */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") {
                setTitleValue(photo.title);
                setIsEditing(false);
              }
            }}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-[#e1306c]/50 min-w-0"
          />
        ) : (
          <button
            type="button"
            className="flex-1 text-left text-white/90 text-sm font-medium truncate cursor-pointer hover:text-white transition-colors bg-transparent border-0 p-0 min-w-0"
            title="Click to edit title"
            onClick={handleEditStart}
          >
            {photo.title || "Untitled"}
          </button>
        )}
        <button
          type="button"
          onClick={handleEditStart}
          className="text-white/30 hover:text-[#e1306c] transition-colors flex-shrink-0"
          aria-label="Edit title"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {updateTitle.isPending && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e1306c] flex-shrink-0" />
        )}
      </div>
    </motion.div>
  );
}

function GalleryPanel() {
  const { data: photos, isLoading, isError } = useGetPhotos();
  const addPhoto = useAddPhotoWithProgress();
  const deletePhoto = useDeletePhoto();

  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedPhotos = [...(photos ?? [])].sort((a, b) => {
    const orderDiff = Number(a.order - b.order);
    if (orderDiff !== 0) return orderDiff;
    return Number(a.id - b.id);
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) {
      toast.error("Please select a file and enter a title.");
      return;
    }

    const arrayBuffer = await selectedFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
    const order = BigInt((photos?.length ?? 0) + 1);

    setUploadProgress(0);

    try {
      await addPhoto.mutateAsync({
        bytes,
        title: uploadTitle.trim(),
        order,
        fileType: "gallery",
        onProgress: (pct) => setUploadProgress(pct),
      });
      toast.success("Photo uploaded successfully!");
      setSelectedFile(null);
      setUploadTitle("");
      setUploadProgress(0);
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Upload failed. Please try again.");
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deletePhoto.mutateAsync(id);
      toast.success("Photo deleted.");
    } catch {
      toast.error("Failed to delete photo.");
    }
  };

  const inputClass =
    "bg-white/5 border-white/12 text-white placeholder:text-white/30 h-11 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl";

  return (
    <div className="space-y-6">
      {/* Upload button + panel */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {sortedPhotos.length} photo{sortedPhotos.length !== 1 ? "s" : ""} in
          gallery
        </p>
        <Button
          data-ocid="gallery.upload_button"
          onClick={() => setShowUpload((v) => !v)}
          className="gap-2 brand-gradient text-white font-bold rounded-xl hover:scale-[1.02] transition-all duration-200"
        >
          {showUpload ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Photo
            </>
          )}
        </Button>
      </div>

      {/* Upload panel */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-6 border border-[#e1306c]/20 space-y-4">
              <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#e1306c]" />
                Upload New Project Photo
              </h3>

              {/* File input */}
              <div className="space-y-2">
                <span className="text-white/80 text-sm font-medium block">
                  Photo File
                </span>
                <label
                  data-ocid="gallery.dropzone"
                  htmlFor="gallery-file-input"
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/15 hover:border-[#e1306c]/40 rounded-xl p-6 cursor-pointer transition-all duration-200 bg-white/3 hover:bg-white/6"
                >
                  {selectedFile ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-[#e1306c]" />
                      <p className="text-white font-medium text-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {(selectedFile.size / 1024).toFixed(0)} KB — click to
                        change
                      </p>
                    </>
                  ) : (
                    <>
                      <Images className="w-8 h-8 text-white/30" />
                      <p className="text-white/60 text-sm">
                        Click to select an image
                      </p>
                      <p className="text-white/30 text-xs">
                        JPG, PNG, WebP supported
                      </p>
                    </>
                  )}
                </label>
                <input
                  id="gallery-file-input"
                  ref={fileInputRef}
                  data-ocid="gallery.upload_button"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Title input */}
              <div className="space-y-2">
                <Label className="text-white/80 text-sm font-medium">
                  Photo Title
                </Label>
                <Input
                  data-ocid="gallery.title.input"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Business Cards for Ravi Textiles"
                  className={inputClass}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && selectedFile) handleUpload();
                  }}
                />
              </div>

              {/* Progress bar */}
              <AnimatePresence>
                {addPhoto.isPending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1.5"
                  >
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading…</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress
                      value={uploadProgress}
                      className="h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-blue-400"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <Button
                data-ocid="gallery.submit_button"
                onClick={handleUpload}
                disabled={
                  addPhoto.isPending || !selectedFile || !uploadTitle.trim()
                }
                className="w-full h-11 brand-gradient text-white font-bold rounded-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:scale-100 gap-2"
              >
                {addPhoto.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div
          data-ocid="gallery.loading_state"
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton
              key={i}
              className="w-full aspect-[4/3] rounded-2xl bg-white/5"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          data-ocid="gallery.error_state"
          className="flex items-center gap-3 p-5 glass rounded-2xl border border-red-500/20 text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Failed to load photos. Please refresh.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sortedPhotos.length === 0 && (
        <div
          data-ocid="gallery.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Images className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-white font-semibold mb-1">No photos yet</p>
          <p className="text-muted-foreground text-sm">
            Upload your first project photo to showcase your work.
          </p>
        </div>
      )}

      {/* Photo grid */}
      {!isLoading && !isError && sortedPhotos.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          data-ocid="gallery.list"
        >
          <AnimatePresence>
            {sortedPhotos.map((photo, idx) => (
              <PhotoCard
                key={String(photo.id)}
                photo={photo}
                idx={idx}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// ─── Reviews Panel ─────────────────────────────────────────────────────────────

function AdminStarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-white/20"}`}
        />
      ))}
    </div>
  );
}

function ReviewItem({
  review,
  idx,
}: {
  review: Review;
  idx: number;
}) {
  const deleteReview = useDeleteReview();
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleDelete = async () => {
    try {
      await deleteReview.mutateAsync(review.id);
      toast.success("Review deleted.");
    } catch {
      toast.error("Failed to delete review.");
    }
    setConfirmDelete(false);
  };

  return (
    <motion.div
      data-ocid={`admin.review.item.${idx + 1}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="glass rounded-2xl p-5 border border-white/8 flex flex-col gap-3"
    >
      {/* Header: avatar + name + date + stars */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              {review.name}
            </p>
            <p className="text-muted-foreground text-xs">{date}</p>
          </div>
        </div>
        <AdminStarRating rating={Number(review.rating)} />
      </div>

      {/* Message */}
      <p className="text-white/80 text-sm leading-relaxed">
        "{review.message}"
      </p>

      {/* Delete action */}
      <div className="flex justify-end">
        <AnimatePresence mode="wait">
          {confirmDelete ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <span className="text-white/60 text-xs">Delete this review?</span>
              <button
                type="button"
                data-ocid={`admin.review.delete_button.${idx + 1}`}
                onClick={handleDelete}
                disabled={deleteReview.isPending}
                className="px-3 py-1 bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {deleteReview.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="trash"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-medium transition-all duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ReviewsPanel() {
  const { data: reviews, isLoading, isError } = useGetReviews();

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {reviews && reviews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-xl p-4 flex flex-col gap-1"
          >
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Total Reviews
            </span>
            <span className="font-display font-black text-3xl text-white">
              {reviews.length}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-4 flex flex-col gap-1 border border-amber-500/20"
          >
            <span className="text-amber-400/70 text-xs uppercase tracking-wider">
              Avg Rating
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-3xl text-amber-300">
                {avgRating.toFixed(1)}
              </span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-xl p-4 flex flex-col gap-1 border border-[#e1306c]/20 sm:col-span-1 col-span-2"
          >
            <span className="text-[#e1306c]/70 text-xs uppercase tracking-wider">
              5-Star Reviews
            </span>
            <span className="font-display font-black text-3xl text-[#e1306c]">
              {reviews.filter((r) => Number(r.rating) === 5).length}
            </span>
          </motion.div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div
          data-ocid="admin.reviews.loading_state"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          data-ocid="admin.reviews.error_state"
          className="flex items-center gap-3 p-5 glass rounded-2xl border border-red-500/20 text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Failed to load reviews. Please refresh.</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && (!reviews || reviews.length === 0) && (
        <div
          data-ocid="admin.reviews.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl"
        >
          <div className="flex items-center gap-0.5 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-7 h-7 text-white/15 fill-transparent"
              />
            ))}
          </div>
          <p className="text-white font-semibold mb-1">No reviews yet</p>
          <p className="text-muted-foreground text-sm">
            Customer reviews will appear here once submitted.
          </p>
        </div>
      )}

      {/* Reviews grid */}
      {!isLoading && !isError && reviews && reviews.length > 0 && (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {reviews.map((review, idx) => (
              <ReviewItem key={String(review.id)} review={review} idx={idx} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// ─── Visitors Panel ────────────────────────────────────────────────────────────

// ─── Compose Message Modal ─────────────────────────────────────────────────────

function ComposeMessageModal({
  open,
  onOpenChange,
  toMobile,
  toName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toMobile: string;
  toName: string;
}) {
  const sendMessage = useSendMessageToCustomer();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in both subject and message.");
      return;
    }
    try {
      await sendMessage.mutateAsync({
        toMobile,
        toName,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success("Message sent!");
      // Open WhatsApp with pre-filled message
      const waText = encodeURIComponent(`${subject.trim()}: ${body.trim()}`);
      const mobileDigits = toMobile.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${mobileDigits}?text=${waText}`, "_blank");
      // Reset and close
      setSubject("");
      setBody("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleClose = () => {
    setSubject("");
    setBody("");
    onOpenChange(false);
  };

  const inputClass =
    "bg-white/5 border-white/12 text-white placeholder:text-white/30 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleClose();
      }}
      role="presentation"
    >
      <motion.div
        data-ocid="admin.compose.dialog"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={
          open
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.95, y: 16 }
        }
        transition={{ duration: 0.2 }}
        className="w-full max-w-md glass rounded-2xl overflow-hidden border border-white/12 shadow-2xl"
      >
        {/* Gradient stripe */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, #833ab4, #e1306c, #fd1d1d, #f56040, #fcb045)",
          }}
        />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center">
                <Mail className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base">
                  Send Message
                </h3>
                <p className="text-muted-foreground text-xs">
                  To: {toName} ({toMobile})
                </p>
              </div>
            </div>
            <button
              type="button"
              data-ocid="admin.compose.close_button"
              onClick={handleClose}
              className="text-white/30 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label
              htmlFor="compose-subject"
              className="text-white/80 text-sm font-medium block"
            >
              Subject
            </label>
            <input
              id="compose-subject"
              data-ocid="admin.compose.input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your Quotation is Ready"
              className={`w-full px-3 h-11 text-sm border ${inputClass}`}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label
              htmlFor="compose-body"
              className="text-white/80 text-sm font-medium block"
            >
              Message
            </label>
            <textarea
              id="compose-body"
              data-ocid="admin.compose.textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message to the customer..."
              rows={4}
              className={`w-full px-3 py-2.5 text-sm border resize-none ${inputClass}`}
            />
          </div>

          {/* Note about WhatsApp */}
          <p className="text-muted-foreground text-xs flex items-center gap-1.5">
            <SiWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
            WhatsApp will open automatically after sending.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              data-ocid="admin.compose.cancel_button"
              onClick={handleClose}
              className="flex-1 h-10 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/8 text-sm font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              data-ocid="admin.compose.submit_button"
              onClick={handleSend}
              disabled={
                sendMessage.isPending || !subject.trim() || !body.trim()
              }
              className="flex-1 h-10 rounded-xl brand-gradient text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:scale-100"
            >
              {sendMessage.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Messages Panel ─────────────────────────────────────────────────────────────

function MessageRow({ msg, idx }: { msg: AdminMessage; idx: number }) {
  const deleteMsg = useDeleteAdminMessage();

  const handleDelete = async () => {
    try {
      await deleteMsg.mutateAsync(msg.id);
      toast.success("Message deleted.");
    } catch {
      toast.error("Failed to delete message.");
    }
  };

  return (
    <TableRow
      data-ocid={`admin.messages.row.${idx + 1}`}
      className="border-white/6 hover:bg-white/4 transition-colors"
    >
      <TableCell className="text-muted-foreground text-sm font-mono w-10">
        {idx + 1}
      </TableCell>
      <TableCell className="text-white font-semibold">{msg.toName}</TableCell>
      <TableCell>
        <span className="text-[#e1306c] text-sm font-medium">
          {msg.toMobile}
        </span>
      </TableCell>
      <TableCell className="text-white/80 text-sm max-w-[200px] truncate">
        {msg.subject}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm hidden md:table-cell whitespace-nowrap">
        {formatTimestamp(msg.timestamp)}
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
            msg.isRead
              ? "bg-white/8 text-white/50 border-white/12"
              : "bg-[#e1306c]/12 text-[#e1306c] border-[#e1306c]/30"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${msg.isRead ? "bg-white/30" : "bg-[#e1306c]"}`}
          />
          {msg.isRead ? "Read" : "Unread"}
        </span>
      </TableCell>
      <TableCell>
        <button
          type="button"
          data-ocid={`admin.messages.delete_button.${idx + 1}`}
          onClick={handleDelete}
          disabled={deleteMsg.isPending}
          className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
          title="Delete message"
        >
          {deleteMsg.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </TableCell>
    </TableRow>
  );
}

function MessagesPanel() {
  const { data: messages, isLoading, isError } = useGetAllAdminMessages();

  const totalCount = messages?.length ?? 0;
  const unreadCount = messages?.filter((m) => !m.isRead).length ?? 0;

  const sortedMessages = [...(messages ?? [])].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl p-4 flex flex-col gap-1"
        >
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Total Sent
          </span>
          <span className="font-display font-black text-3xl text-white">
            {isLoading ? (
              <Skeleton className="h-8 w-12 bg-white/5" />
            ) : (
              totalCount
            )}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 flex flex-col gap-1 border border-[#e1306c]/20"
        >
          <span className="text-[#e1306c]/70 text-xs uppercase tracking-wider">
            Unread
          </span>
          <span className="font-display font-black text-3xl text-[#e1306c]">
            {isLoading ? (
              <Skeleton className="h-8 w-12 bg-white/5" />
            ) : (
              unreadCount
            )}
          </span>
        </motion.div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div data-ocid="admin.messages.loading_state" className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          data-ocid="admin.messages.error_state"
          className="flex items-center gap-3 p-5 glass rounded-2xl border border-red-500/20 text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Failed to load messages. Please refresh.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sortedMessages.length === 0 && (
        <div
          data-ocid="admin.messages.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-white font-semibold mb-1">No messages sent yet</p>
          <p className="text-muted-foreground text-sm">
            Go to the Visitors tab and click "Send Message" to reach out to a
            customer.
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && sortedMessages.length > 0 && (
        <div
          data-ocid="admin.messages.table"
          className="glass rounded-2xl overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="text-white/60 font-semibold w-10">
                  #
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Recipient
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Mobile
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Subject
                </TableHead>
                <TableHead className="text-white/60 font-semibold hidden md:table-cell">
                  Date
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Status
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMessages.map((msg, idx) => (
                <MessageRow key={String(msg.id)} msg={msg} idx={idx} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Visitor Row ────────────────────────────────────────────────────────────────

function VisitorRow({ customer, idx }: { customer: Customer; idx: number }) {
  const [composeOpen, setComposeOpen] = useState(false);
  const whatsappMsg = encodeURIComponent(
    `Hi ${customer.name}, thank you for visiting Nellore Print Hub! How can we help you today?`,
  );

  return (
    <>
      <TableRow
        data-ocid={`admin.visitors.row.${idx + 1}`}
        className="border-white/6 hover:bg-white/4 transition-colors"
      >
        <TableCell className="text-muted-foreground text-sm font-mono w-10">
          {idx + 1}
        </TableCell>
        <TableCell className="text-white font-semibold">
          {customer.name}
        </TableCell>
        <TableCell>
          <a
            href={`tel:${customer.mobile}`}
            className="text-[#e1306c] hover:text-[#fcb045] text-sm font-medium transition-colors"
          >
            {customer.mobile}
          </a>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm hidden lg:table-cell whitespace-nowrap">
          {formatTimestamp(customer.firstVisit)}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm hidden md:table-cell whitespace-nowrap">
          {formatTimestamp(customer.lastVisit)}
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#e1306c]/12 text-[#fcb045] border border-[#e1306c]/30">
            <UserCheck className="w-3 h-3" />
            {String(customer.visitCount)}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <a href={`tel:${customer.mobile}`}>
              <button
                type="button"
                title="Call"
                className="w-7 h-7 rounded-lg bg-[#e1306c]/10 border border-[#e1306c]/30 text-[#fcb045] hover:bg-[#e1306c]/20 flex items-center justify-center transition-all duration-200"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
            </a>
            <a
              href={`https://wa.me/${customer.mobile.replace(/[^0-9]/g, "")}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button
                type="button"
                title="WhatsApp"
                className="w-7 h-7 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 flex items-center justify-center transition-all duration-200"
              >
                <SiWhatsapp className="w-3.5 h-3.5" />
              </button>
            </a>
            <button
              type="button"
              data-ocid={`admin.visitors.message.button.${idx + 1}`}
              title="Send Message"
              onClick={() => setComposeOpen(true)}
              className="w-7 h-7 rounded-lg bg-[#833ab4]/10 border border-[#833ab4]/30 text-[#833ab4] hover:bg-[#833ab4]/20 flex items-center justify-center transition-all duration-200"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          </div>
        </TableCell>
      </TableRow>
      <ComposeMessageModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        toMobile={customer.mobile}
        toName={customer.name}
      />
    </>
  );
}

function VisitorsPanel() {
  const { data: customers, isLoading, isError } = useGetCustomers();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const newTodayCount =
    customers?.filter((c) => {
      try {
        const ms = Number(c.firstVisit / 1_000_000n);
        return ms >= todayStartMs;
      } catch {
        return false;
      }
    }).length ?? 0;

  const totalCount = customers?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl p-4 flex flex-col gap-1"
        >
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Total Visitors
          </span>
          <span className="font-display font-black text-3xl text-white">
            {isLoading ? (
              <Skeleton className="h-8 w-12 bg-white/5" />
            ) : (
              totalCount
            )}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 flex flex-col gap-1 border border-[#e1306c]/20"
        >
          <span className="text-[#e1306c]/70 text-xs uppercase tracking-wider">
            New Today
          </span>
          <span className="font-display font-black text-3xl text-[#e1306c]">
            {isLoading ? (
              <Skeleton className="h-8 w-12 bg-white/5" />
            ) : (
              newTodayCount
            )}
          </span>
        </motion.div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div data-ocid="admin.visitors.loading_state" className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          data-ocid="admin.visitors.error_state"
          className="flex items-center gap-3 p-5 glass rounded-2xl border border-red-500/20 text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Failed to load visitors. Please refresh.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && (!customers || customers.length === 0) && (
        <div
          data-ocid="admin.visitors.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-white font-semibold mb-1">No visitors yet</p>
          <p className="text-muted-foreground text-sm">
            Visitors who sign in on the site will appear here.
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && customers && customers.length > 0 && (
        <div
          data-ocid="admin.visitors.table"
          className="glass rounded-2xl overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="text-white/60 font-semibold w-10">
                  #
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Name
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Mobile
                </TableHead>
                <TableHead className="text-white/60 font-semibold hidden lg:table-cell">
                  First Visit
                </TableHead>
                <TableHead className="text-white/60 font-semibold hidden md:table-cell">
                  Last Visit
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Visits
                </TableHead>
                <TableHead className="text-white/60 font-semibold w-24">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, idx) => (
                <VisitorRow
                  key={String(customer.id)}
                  customer={customer}
                  idx={idx}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Promo Panel ───────────────────────────────────────────────────────────────

function PromoPanel() {
  const { data: promo, isLoading, isError } = useGetPromoSettings();
  const updatePromo = useUpdatePromoSettings();

  const [form, setForm] = useState<PromoSettings>({
    offerTitle: "",
    offerDescription: "",
    discountPercent: "",
    discountCode: "",
    isActive: true,
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (promo && !initialized) {
      setForm({
        offerTitle: promo.offerTitle,
        offerDescription: promo.offerDescription,
        discountPercent: promo.discountPercent,
        discountCode: promo.discountCode,
        isActive: promo.isActive,
      });
      setInitialized(true);
    }
  }, [promo, initialized]);

  const handleSave = async () => {
    try {
      await updatePromo.mutateAsync(form);
      window.dispatchEvent(new Event("promo-updated"));
      toast.success("Promo saved! Welcome banner updated.");
    } catch {
      toast.error("Failed to save promo settings. Please try again.");
    }
  };

  const inputClass =
    "bg-white/5 border-white/12 text-white placeholder:text-white/30 h-11 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl";

  if (isLoading) {
    return (
      <div
        data-ocid="admin.promo.loading_state"
        className="space-y-4 max-w-2xl"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28 bg-white/5" />
            <Skeleton className="h-11 w-full bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="admin.promo.error_state"
        className="flex items-center gap-3 p-5 glass rounded-2xl border border-red-500/20 text-red-400 max-w-2xl"
      >
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">
          Failed to load promo settings. Please refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Live preview badge */}
      <div className="flex items-center gap-3 p-4 glass rounded-2xl border border-[#e1306c]/20">
        <div className="w-9 h-9 rounded-xl bg-[#e1306c]/20 flex items-center justify-center flex-shrink-0">
          <Gift className="w-4 h-4 text-[#fcb045]" />
        </div>
        <div>
          <p className="text-white/90 text-sm font-semibold">
            Welcome Popup Promo
          </p>
          <p className="text-muted-foreground text-xs">
            Edit the promotional offer shown to customers when they first log
            in.
          </p>
        </div>
      </div>

      {/* Main form card */}
      <div className="glass rounded-2xl p-6 space-y-6 border border-white/8">
        {/* Active toggle */}
        <div className="flex items-center justify-between py-2 border-b border-white/8 pb-5">
          <div>
            <Label className="text-white font-semibold text-base">
              Show Promo Popup
            </Label>
            <p className="text-muted-foreground text-xs mt-0.5">
              Enable or disable the promotional popup for all visitors
            </p>
          </div>
          <Switch
            data-ocid="admin.promo.switch"
            checked={form.isActive}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, isActive: checked }))
            }
            className="data-[state=checked]:bg-[#e1306c]"
          />
        </div>

        <div className="space-y-5">
          {/* Offer Title */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">
              Offer Title
            </Label>
            <Input
              data-ocid="admin.promo.title.input"
              value={form.offerTitle}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, offerTitle: e.target.value }))
              }
              placeholder="e.g. 🎁 Special Offer For You"
              className={inputClass}
            />
          </div>

          {/* Offer Description */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">
              Offer Description
            </Label>
            <Textarea
              data-ocid="admin.promo.description.textarea"
              value={form.offerDescription}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  offerDescription: e.target.value,
                }))
              }
              placeholder="e.g. Get 10% OFF on your first order! Premium business cards, banners, t-shirts & more — all under one roof."
              rows={3}
              className="bg-white/5 border-white/12 text-white placeholder:text-white/30 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Shown as the main promo message to customers.
            </p>
          </div>

          {/* Discount percent + code in a 2-col grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80 text-sm font-medium">
                Discount Percent
              </Label>
              <Input
                data-ocid="admin.promo.percent.input"
                value={form.discountPercent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    discountPercent: e.target.value,
                  }))
                }
                placeholder="e.g. 10"
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground">
                Just the number — "10" shows as 10% OFF
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80 text-sm font-medium">
                Discount Code
              </Label>
              <Input
                data-ocid="admin.promo.code.input"
                value={form.discountCode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    discountCode: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g. WELCOME10"
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground">
                Shown as a promo code pill in the popup
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live preview */}
      {form.isActive && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 border border-[#e1306c]/20"
        >
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3 font-semibold">
            Preview — how it looks to customers
          </p>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "rgba(225,48,108,0.08)",
              border: "1px solid rgba(225,48,108,0.20)",
            }}
          >
            <div
              className="h-1 w-full"
              style={{
                background:
                  "linear-gradient(90deg, #833ab4 0%, #e1306c 40%, #fcb045 100%)",
              }}
            />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 brand-gradient">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white/90 text-sm mb-1">
                    {form.offerTitle || "Special Offer For You"}
                  </p>
                  <p className="text-white/55 text-xs leading-relaxed">
                    {form.offerDescription ||
                      "Get 10% OFF on your first order! Premium business cards, banners & more."}
                  </p>
                </div>
              </div>
              {form.discountCode && (
                <div className="mt-3 flex justify-center">
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider brand-gradient"
                    style={{ color: "white" }}
                  >
                    ✨ Use code: {form.discountCode}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Save button */}
      <Button
        data-ocid="admin.promo.save_button"
        onClick={handleSave}
        disabled={updatePromo.isPending}
        className="w-full h-12 brand-gradient text-white font-bold rounded-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-60 disabled:scale-100 text-base gap-2"
      >
        {updatePromo.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Promo Settings
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Files Panel (Drive) ────────────────────────────────────────────────────────

const FILE_TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  gallery: {
    label: "Gallery",
    cls: "bg-[#833ab4]/15 text-[#833ab4] border-[#833ab4]/30",
  },
  logo: {
    label: "Logo",
    cls: "bg-[#fcb045]/15 text-[#fcb045] border-[#fcb045]/30",
  },
  document: {
    label: "Document",
    cls: "bg-[#e1306c]/15 text-[#fcb045] border-[#e1306c]/30",
  },
  attachment: {
    label: "Attachment",
    cls: "bg-white/10 text-white/60 border-white/20",
  },
};

function FilesPanel() {
  const { data: allFiles, isLoading, isError } = useGetAllFiles();
  const deletePhoto = useDeletePhoto();
  const addPhoto = useAddPhotoWithProgress();
  const _uploadFileAndGetUrl = useUploadFileAndGetUrl();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = (allFiles ?? [])
    .filter((f) => filterType === "all" || f.fileType === filterType)
    .filter(
      (f) =>
        search.trim() === "" ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.fileType.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => Number(b.timestamp - a.timestamp));

  const stats = {
    total: allFiles?.length ?? 0,
    images:
      allFiles?.filter((f) => ["gallery", "logo"].includes(f.fileType))
        .length ?? 0,
    docs:
      allFiles?.filter((f) => ["document", "attachment"].includes(f.fileType))
        .length ?? 0,
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file.");
      return;
    }
    const title = uploadTitle.trim() || uploadFile.name;
    try {
      const arrayBuffer = await uploadFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
      await addPhoto.mutateAsync({
        bytes,
        title,
        order: 0n,
        fileType: "document",
        onProgress: (pct) => setUploadProgress(pct),
      });
      toast.success("File uploaded successfully!");
      setUploadFile(null);
      setUploadTitle("");
      setUploadProgress(0);
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Upload failed. Please try again.");
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deletePhoto.mutateAsync(id);
      toast.success("File deleted.");
    } catch {
      toast.error("Failed to delete file.");
    }
  };

  const inputClass =
    "bg-white/5 border-white/12 text-white placeholder:text-white/30 h-11 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20 rounded-xl";

  const FILE_TYPES = ["all", "gallery", "logo", "document", "attachment"];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Files", value: stats.total, cls: "" },
          { label: "Images", value: stats.images, cls: "border-[#833ab4]/20" },
          { label: "Documents", value: stats.docs, cls: "border-[#e1306c]/20" },
        ].map(({ label, value, cls }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass rounded-xl p-4 flex flex-col gap-1 ${cls}`}
          >
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              {label}
            </span>
            <span className="font-display font-black text-3xl text-white">
              {isLoading ? <Skeleton className="h-8 w-10 bg-white/5" /> : value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Search + Filter + Upload button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            data-ocid="files.search_input"
            placeholder="Search by name or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/12 text-white placeholder:text-white/30 h-10 px-3 pl-9 rounded-xl text-sm focus:outline-none focus:border-[#e1306c]/40"
          />
          <HardDrive className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              data-ocid="files.filter.tab"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize ${
                filterType === t
                  ? "brand-gradient text-white font-bold"
                  : "glass text-white/60 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button
          data-ocid="files.upload_button"
          onClick={() => setShowUpload((v) => !v)}
          size="sm"
          className="gap-2 brand-gradient text-white font-bold rounded-xl"
        >
          {showUpload ? (
            <X className="w-4 h-4" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {showUpload ? "Cancel" : "Upload"}
        </Button>
      </div>

      {/* Upload panel */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-5 border border-[#e1306c]/20 space-y-4">
              <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#e1306c]" />
                Upload Document / File
              </h3>
              <label
                data-ocid="files.dropzone"
                htmlFor="files-upload-input"
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/15 hover:border-[#e1306c]/40 rounded-xl p-5 cursor-pointer transition-all bg-white/3 hover:bg-white/6"
              >
                {uploadFile ? (
                  <>
                    <CheckCircle2 className="w-7 h-7 text-[#e1306c]" />
                    <p className="text-white font-medium text-sm">
                      {uploadFile.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {(uploadFile.size / 1024).toFixed(0)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-7 h-7 text-white/25" />
                    <p className="text-white/55 text-sm">
                      Click to select any file
                    </p>
                  </>
                )}
              </label>
              <input
                id="files-upload-input"
                ref={fileInputRef}
                type="file"
                accept="*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setUploadFile(f);
                    if (!uploadTitle)
                      setUploadTitle(f.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
              />
              <div className="space-y-1">
                <label
                  htmlFor="files-title-input"
                  className="text-white/70 text-sm font-medium block"
                >
                  File Name / Title
                </label>
                <Input
                  id="files-title-input"
                  data-ocid="files.title.input"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Price List 2025"
                  className={inputClass}
                />
              </div>
              {addPhoto.isPending && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Uploading…</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress
                    value={uploadProgress}
                    className="h-1.5 bg-white/10 [&>div]:bg-[#e1306c]"
                  />
                </div>
              )}
              <Button
                data-ocid="files.submit_button"
                onClick={handleUpload}
                disabled={addPhoto.isPending || !uploadFile}
                className="w-full h-10 brand-gradient text-white font-bold rounded-xl gap-2"
              >
                {addPhoto.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div data-ocid="files.loading_state" className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          data-ocid="files.error_state"
          className="flex items-center gap-3 p-5 glass rounded-2xl border border-red-500/20 text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Failed to load files. Please refresh.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div
          data-ocid="files.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <HardDrive className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-white font-semibold mb-1">No files found</p>
          <p className="text-muted-foreground text-sm">
            {filterType === "all"
              ? "Upload a file to get started."
              : `No "${filterType}" files found.`}
          </p>
        </div>
      )}

      {/* Files table */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div
          data-ocid="files.table"
          className="glass rounded-2xl overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="text-white/60 font-semibold w-10">
                  #
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Preview
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Name
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Type
                </TableHead>
                <TableHead className="text-white/60 font-semibold hidden md:table-cell">
                  Date
                </TableHead>
                <TableHead className="text-white/60 font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((file, idx) => {
                const isImg =
                  ["gallery", "logo"].includes(file.fileType) ||
                  /\.(png|jpg|jpeg|gif|webp)$/i.test(file.title);
                const directUrl = file.blob.getDirectURL();
                const typeConfig =
                  FILE_TYPE_LABELS[file.fileType] ??
                  FILE_TYPE_LABELS.attachment;
                const filename = file.title || `file_${idx}`;

                return (
                  <TableRow
                    key={String(file.id)}
                    data-ocid={`files.row.${idx + 1}`}
                    className="border-white/6 hover:bg-white/4 transition-colors"
                  >
                    <TableCell className="text-muted-foreground text-sm font-mono w-10">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="w-16">
                      {isImg ? (
                        <img
                          src={directUrl}
                          alt={file.title}
                          className="w-12 h-9 object-cover rounded-lg border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white/30" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-white text-sm font-medium max-w-[150px] truncate">
                      {file.title}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${typeConfig.cls}`}
                      >
                        {file.fileType}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell whitespace-nowrap">
                      {formatTimestamp(file.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={directUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            title="Open file"
                            className="w-7 h-7 rounded-lg bg-white/8 border border-white/15 text-white/60 hover:text-white hover:bg-white/15 flex items-center justify-center transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </a>
                        <button
                          type="button"
                          data-ocid={`files.download_button.${idx + 1}`}
                          title="Download"
                          onClick={() => forceDownloadFile(directUrl, filename)}
                          className="w-7 h-7 rounded-lg bg-white/8 border border-white/15 text-white/60 hover:text-white hover:bg-white/15 flex items-center justify-center transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          data-ocid={`files.delete_button.${idx + 1}`}
                          title="Delete"
                          onClick={() => handleDelete(file.id)}
                          disabled={deletePhoto.isPending}
                          className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all disabled:opacity-50"
                        >
                          {deletePhoto.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard (after login) ───────────────────────────────────────────────────

type AdminTab =
  | "quotes"
  | "settings"
  | "gallery"
  | "reviews"
  | "visitors"
  | "messages"
  | "promo"
  | "files";

function Dashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("quotes");

  return (
    <div className="min-h-screen bg-background text-foreground print-bg">
      {/* Top header bar */}
      <header className="glass-dark border-b border-white/8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo + title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center">
              <Printer className="w-4 h-4 text-black" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-black text-lg text-white leading-none">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-xs">Nellore Print Hub</p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 rounded-xl glass p-1">
            <button
              type="button"
              data-ocid="admin.quotes.tab"
              onClick={() => setActiveTab("quotes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "quotes"
                  ? "brand-gradient text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Quotes</span>
            </button>
            <button
              type="button"
              data-ocid="admin.settings.tab"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "settings"
                  ? "brand-gradient text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Site Settings</span>
            </button>
            <button
              type="button"
              data-ocid="admin.gallery.tab"
              onClick={() => setActiveTab("gallery")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "gallery"
                  ? "brand-gradient text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Images className="w-4 h-4" />
              <span className="hidden sm:inline">Gallery</span>
            </button>
            <button
              type="button"
              data-ocid="admin.reviews.tab"
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "reviews"
                  ? "brand-gradient text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </button>
            <button
              type="button"
              data-ocid="admin.visitors.tab"
              onClick={() => setActiveTab("visitors")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "visitors"
                  ? "brand-gradient text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Visitors</span>
            </button>
            <button
              type="button"
              data-ocid="admin.messages.tab"
              onClick={() => setActiveTab("messages")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "messages"
                  ? "brand-gradient text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </button>
            <button
              type="button"
              data-ocid="admin.promo.tab"
              onClick={() => setActiveTab("promo")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "promo"
                  ? "brand-gradient text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Promo</span>
            </button>
            <button
              type="button"
              data-ocid="admin.files.tab"
              onClick={() => setActiveTab("files")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "files"
                  ? "brand-gradient text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span className="hidden sm:inline">Files</span>
            </button>
          </div>

          {/* Back to site */}
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to site</span>
          </a>
        </div>

        {/* Brand gradient stripe */}
        <div
          className="w-full h-0.5 opacity-60"
          style={{
            background:
              "linear-gradient(90deg, #833ab4, #e1306c, #fd1d1d, #f56040, #fcb045)",
          }}
        />
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "quotes" ? (
            <motion.div
              key="quotes"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-[#e1306c]" />
                  Quote Requests
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  View and manage all incoming print quote requests.
                </p>
              </div>
              <QuotesPanel />
            </motion.div>
          ) : activeTab === "settings" ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-[#e1306c]" />
                  Site Settings
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Edit your business info — changes go live immediately.
                </p>
              </div>
              <div className="max-w-2xl">
                <SiteSettingsPanel />
              </div>
            </motion.div>
          ) : activeTab === "gallery" ? (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <Images className="w-6 h-6 text-[#e1306c]" />
                  Project Gallery
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Upload and manage photos shown in the gallery.
                </p>
              </div>
              <GalleryPanel />
            </motion.div>
          ) : activeTab === "reviews" ? (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  Customer Reviews
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  View and manage customer reviews submitted on the site.
                </p>
              </div>
              <ReviewsPanel />
            </motion.div>
          ) : activeTab === "visitors" ? (
            <motion.div
              key="visitors"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#e1306c]" />
                  Site Visitors
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Customers who have signed in on the website.
                </p>
              </div>
              <VisitorsPanel />
            </motion.div>
          ) : activeTab === "messages" ? (
            <motion.div
              key="messages"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <Mail className="w-6 h-6 text-[#e1306c]" />
                  Messages
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  All messages sent to customers via the website.
                </p>
              </div>
              <MessagesPanel />
            </motion.div>
          ) : activeTab === "promo" ? (
            <motion.div
              key="promo"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <Gift className="w-6 h-6 text-[#e1306c]" />
                  Promo Settings
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Edit the welcome popup promo offer shown to customers after
                  login.
                </p>
              </div>
              <PromoPanel />
            </motion.div>
          ) : (
            <motion.div
              key="files"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <HardDrive className="w-6 h-6 text-[#e1306c]" />
                  File Drive
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  View, download, and manage all uploaded files — gallery
                  images, logos, documents, and attachments.
                </p>
              </div>
              <FilesPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    await new Promise((r) => setTimeout(r, 500));
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      setError(true);
    }
    setIsLoading(false);
  };

  if (authenticated) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #833ab4, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm"
      >
        <div className="glass rounded-2xl p-8 border border-white/10">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center fire-glow">
              <Lock className="w-7 h-7 text-black" />
            </div>
            <div className="text-center">
              <h1 className="font-display font-black text-xl text-white">
                Admin Access
              </h1>
              <p className="text-muted-foreground text-sm">Nellore Print Hub</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="admin-pass"
                className="text-white/80 text-sm font-medium"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="admin-pass"
                  type={showPass ? "text" : "password"}
                  data-ocid="admin.input"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  required
                  className={`bg-white/5 border-white/12 text-white placeholder:text-white/30 h-11 pr-10 ${
                    error
                      ? "border-red-500/50 focus:border-red-500/50"
                      : "focus:border-[#e1306c]/50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  data-ocid="admin.error_state"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Access Denied. Incorrect password.
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              data-ocid="admin.submit_button"
              disabled={isLoading}
              className="w-full h-11 brand-gradient text-white font-bold rounded-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Login to Dashboard"
              )}
            </Button>
          </form>

          <a
            href="/"
            className="block text-center mt-5 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            ← Back to website
          </a>
        </div>
      </motion.div>
    </div>
  );
}
