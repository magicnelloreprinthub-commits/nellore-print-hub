import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Mail,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import type { AdminMessage } from "../backend.d";
import {
  useGetMessagesForCustomer,
  useMarkMessageRead,
} from "../hooks/useQueries";

function formatMessageDate(ts: bigint): string {
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

function forceDownload(url: string, filename: string) {
  // Try fetch with CORS first, fall back to direct anchor download
  fetch(url, { mode: "cors" })
    .then((r) => {
      if (!r.ok) throw new Error("fetch failed");
      return r.blob();
    })
    .then((blob) => {
      // Preserve original MIME type so the file saves with the correct extension
      const blobWithType = new Blob([blob], {
        type: blob.type || "application/octet-stream",
      });
      const objectUrl = URL.createObjectURL(blobWithType);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      }, 200);
    })
    .catch(() => {
      // CORS blocked — use direct anchor with download attribute as fallback
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 200);
    });
}

function getMessageStyle(
  subject: string,
): "accepted" | "rejected" | "normal" | "quotation" {
  const s = subject.toLowerCase();
  if (s.includes("accepted")) return "accepted";
  if (s.includes("rejected") || s.includes("action required"))
    return "rejected";
  if (s.includes("quotation")) return "quotation";
  return "normal";
}

function MessageCard({
  message,
  idx,
}: {
  message: AdminMessage;
  idx: number;
  customerName: string;
}) {
  const waText = encodeURIComponent(
    `Re: ${message.subject} - Hi, I received your message. `,
  );
  const waUrl = `https://wa.me/919390535070?text=${waText}`;

  // Parse structured format: FILENAME:<name>\nFILEURL:<url>
  const filenameMatch = message.body.match(/FILENAME:([^\n]+)/);
  const fileUrlMatch = message.body.match(/FILEURL:(https?:\/\/[^\s]+)/);
  // Also support legacy format where URL appears inline
  const legacyUrlMatch = message.body.match(/https?:\/\/[^\s]+/);

  const fileUrl = fileUrlMatch
    ? fileUrlMatch[1].trim()
    : legacyUrlMatch
      ? legacyUrlMatch[0].trim()
      : null;
  const filename = filenameMatch
    ? filenameMatch[1].trim()
    : fileUrl
      ? fileUrl.split("/").pop()?.split("?")[0] || "quotation"
      : "quotation";

  const messageStyle = getMessageStyle(message.subject);

  // Determine if it's an image or document by filename extension
  const isImage = filename
    ? /\.(png|jpg|jpeg|gif|webp)$/i.test(filename)
    : false;

  const containerStyle = (() => {
    if (messageStyle === "accepted")
      return "border-emerald-500/30 bg-emerald-500/6";
    if (messageStyle === "rejected") return "border-red-500/30 bg-red-500/6";
    if (!message.isRead) return "border-[#e1306c]/30 bg-[#e1306c]/6";
    return "border-white/8 bg-white/3";
  })();

  const iconEl = (() => {
    if (messageStyle === "accepted")
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      );
    if (messageStyle === "rejected")
      return (
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        </div>
      );
    return (
      <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center flex-shrink-0">
        <Mail className="w-3.5 h-3.5 text-black" />
      </div>
    );
  })();

  const statusBadge = (() => {
    if (messageStyle === "accepted")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          Accepted
        </span>
      );
    if (messageStyle === "rejected")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    if (!message.isRead)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#e1306c]/20 text-[#e1306c] border border-[#e1306c]/30 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e1306c] animate-pulse" />
          Unread
        </span>
      );
    return null;
  })();

  // Body text: strip structured tags and URLs from display text
  const cleanBody = message.body
    .replace(/FILENAME:[^\n]*/g, "")
    .replace(/FILEURL:https?:\/\/[^\s]*/g, "")
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

  return (
    <motion.div
      data-ocid={`messages.item.${idx + 1}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, delay: idx * 0.05 }}
      className={`rounded-2xl p-4 border transition-all duration-200 ${containerStyle}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {iconEl}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">
              {message.subject}
            </p>
            <p className="text-white/40 text-xs mt-0.5">
              {formatMessageDate(message.timestamp)}
            </p>
          </div>
        </div>
        {statusBadge}
      </div>

      {/* Body text */}
      <p className="text-white/75 text-sm leading-relaxed pl-10">{cleanBody}</p>

      {/* File/PDF Card */}
      {fileUrl && (
        <div
          className="mt-3 w-full"
          data-ocid={`messages.quotation.panel.${idx + 1}`}
        >
          <div
            className={`flex items-center gap-2 flex-wrap p-3 rounded-xl border ${
              messageStyle === "accepted"
                ? "border-emerald-500/25 bg-emerald-500/8"
                : "border-[#e1306c]/25 bg-[#e1306c]/8"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#e1306c]/20 flex items-center justify-center flex-shrink-0">
              {isImage ? (
                <img
                  src={fileUrl}
                  alt="attachment thumbnail"
                  className="w-9 h-9 rounded-lg object-cover"
                />
              ) : (
                <FileText className="w-4 h-4 text-[#fcb045]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#fcb045] text-sm font-bold truncate">
                {isImage ? "Image Attachment" : "File Attachment"}
              </p>
              <p className="text-white/40 text-xs truncate">{filename}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid={`messages.quotation.button.${idx + 1}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#fcb045]/15 text-[#fcb045] border border-[#fcb045]/40 hover:bg-[#fcb045]/25 transition-all duration-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open
              </a>
              <button
                type="button"
                onClick={() => forceDownload(fileUrl, filename)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/8 text-white/70 border border-white/15 hover:bg-white/15 transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap justify-end gap-2 mt-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366]/12 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 transition-all duration-200"
        >
          <SiWhatsapp className="w-3.5 h-3.5" />
          Reply on WhatsApp
        </a>
      </div>
    </motion.div>
  );
}

interface CustomerMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: string;
  customerName: string;
}

export default function CustomerMessagesModal({
  open,
  onOpenChange,
  mobile,
  customerName,
}: CustomerMessagesModalProps) {
  const { data: messages, isLoading } = useGetMessagesForCustomer(mobile);
  const markRead = useMarkMessageRead();
  const markReadRef = useRef(markRead.mutateAsync);
  markReadRef.current = markRead.mutateAsync;

  // Auto-mark all unread messages as read when modal opens
  useEffect(() => {
    if (!open || !messages) return;
    const unread = messages.filter((m) => !m.isRead);
    if (unread.length === 0) return;
    // Mark all unread in parallel
    Promise.all(unread.map((m) => markReadRef.current(m.id))).catch(() => {
      // silently ignore
    });
  }, [open, messages]);

  const sortedMessages = [...(messages ?? [])].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="messages.dialog"
        className="max-w-lg w-full rounded-2xl border border-white/12 p-0 overflow-hidden"
        style={{ background: "rgba(10,10,10,0.98)" }}
      >
        {/* Header gradient stripe */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, #833ab4, #e1306c, #fd1d1d, #f56040, #fcb045)",
          }}
        />

        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white font-display font-bold text-lg">
              <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-black" />
              </div>
              <div>
                <span>My Messages</span>
                <p className="text-muted-foreground text-xs font-normal mt-0.5">
                  Messages from Nellore Print Hub for {customerName}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-5 max-h-[60vh] overflow-y-auto pr-1 -mr-1 space-y-3">
            {/* Loading */}
            {isLoading && (
              <div data-ocid="messages.loading_state" className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-28 w-full rounded-2xl bg-white/5"
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && sortedMessages.length === 0 && (
              <div
                data-ocid="messages.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/60 font-semibold text-sm">
                  No messages from us yet
                </p>
                <p className="text-white/30 text-xs mt-1">
                  We'll notify you here when we send something special.
                </p>
              </div>
            )}

            {/* Messages */}
            {!isLoading && sortedMessages.length > 0 && (
              <AnimatePresence initial={false}>
                {sortedMessages.map((msg, idx) => (
                  <MessageCard
                    key={String(msg.id)}
                    message={msg}
                    idx={idx}
                    customerName={customerName}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
