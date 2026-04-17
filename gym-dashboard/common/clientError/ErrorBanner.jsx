"use client";
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  Bug,
} from "lucide-react";
import { Button } from "../../components/ui/button";

/* ─── Keyframes ─────────────────────────────────────────────────────────── */
const Keyframes = () => (
  <style>{`
    @keyframes ge-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .ge-spin { animation: ge-spin 0.75s linear infinite; }

    .ge-details-wrap {
      display: grid;
      grid-template-rows: 0fr;
      opacity: 0;
      transition: grid-template-rows 0.25s ease, opacity 0.22s ease;
    }
    .ge-details-wrap.open {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    .ge-details-inner { overflow: hidden; }
  `}</style>
);

/* ─── Helper ────────────────────────────────────────────────────────────── */
function formatDetails(details) {
  if (details == null) return "";
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function ErrorBanner({
  title = "Unexpected error",
  message = "An error occurred. Please try again.",
  details = null,
  retryText = "Retry",
  onRetry,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  const detailsText = useMemo(() => formatDetails(details), [details]);

  /* ── Retry handler ── */
  const handleRetry = async () => {
    setWorking(true);
    try {
      if (typeof onRetry === "function") {
        const res = onRetry();
        if (res && typeof res.then === "function") await res;
      } else {
        document.dispatchEvent(
          new CustomEvent("retry", {
            bubbles: true,
            detail: { source: "ErrorBanner" },
          }),
        );
      }
    } finally {
      setWorking(false);
    }
  };

  /* ── Copy handler ── */
  const handleCopy = async () => {
    const payload = {
      title,
      message,
      details: details ?? null,
      timestamp: new Date().toISOString(),
    };
    const text =
      typeof payload.details === "string"
        ? `${payload.title}\n${payload.message}\n\n${payload.details}\n${payload.timestamp}`
        : JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  /* ── Size variants ── */
  const pad = compact ? "p-3 sm:p-4" : "p-4 sm:p-5";
  const gap = compact ? "gap-3" : "gap-4";
  const iconSize = compact ? "size-10" : "size-12";
  const iconInner = compact ? "size-4" : "size-5";
  const titleSize = compact ? "text-sm sm:text-base" : "text-base sm:text-lg";
  const msgSize = compact ? "text-xs" : "text-sm";
  const btnPad = compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";
  const btnGap = compact ? "gap-1.5" : "gap-2";
  const topMt = compact ? "mt-2.5" : "mt-3";
  const actionsMt = compact ? "mt-2.5" : "mt-3.5";

  return (
    <>
      <Keyframes />

      <section className="" role="alert" aria-live="polite">
        {/* Banner shell — red theme */}
        <div className="relative overflow-hidden rounded-2xl border bg-red-700 border-red-400/25 ring-1 ring-red-400/20 max-w-max mt-10">
          <div className={pad}>
            <div className={`flex items-start ${gap}`}>
              {/* Icon box */}
              <div
                className={`${iconSize} shrink-0 rounded-xl flex items-center justify-center bg-red-500/15 border border-red-400/25`}
              >
                <Bug
                  className={`${iconInner} text-red-100`}
                  strokeWidth={1.75}
                />
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <h2
                  className={`${titleSize} font-semibold tracking-tight text-red-50`}
                >
                  {title}
                </h2>

                <p
                  className={`mt-1 ${msgSize} leading-relaxed text-red-200/80`}
                >
                  {message}
                </p>

                {/* Expandable details */}
                {details != null && (
                  <div className={topMt}>
                    <Button
                      variant="ghost"
                      onClick={() => setOpen((v) => !v)}
                      aria-expanded={open}
                      className="inline-flex items-center gap-1.5 hover:bg-transparent text-xs font-medium transition-colors duration-150 text-red-300 hover:text-red-100"
                    >
                      <ChevronDown
                        className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
                        strokeWidth={2.5}
                      />
                      <span>{open ? "Hide details" : "Show details"}</span>
                    </Button>

                    <div className={`ge-details-wrap${open ? " open" : ""}`}>
                      <div className="ge-details-inner">
                        <pre className="mt-2 rounded-lg border p-3 text-[0.75rem] leading-relaxed whitespace-pre-wrap break-words font-mono max-h-44 overflow-y-auto bg-red-950/50 border-red-400/20 text-red-200/80">
                          {detailsText}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div
                  className={`${actionsMt} flex flex-wrap items-center ${btnGap}`}
                >
                  {/* Retry */}
                  <Button
                    variant="ghost"
                    onClick={handleRetry}
                    disabled={working}
                    className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 border-red-400/30 text-red-100 focus:ring-red-400/30 ${btnPad}`}
                  >
                    <RefreshCw
                      className={`size-3.5 ${working ? "ge-spin" : ""}`}
                      strokeWidth={2}
                    />
                    <span>{working ? "Working…" : retryText}</span>
                  </Button>

                  {/* Copy */}
                  <Button
                    variant="ghost"
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all duration-150 focus:outline-none focus:ring-2 bg-red-500/10 hover:bg-red-500/20 border-red-400/20 hover:border-red-400/35 text-red-200 hover:text-red-100 focus:ring-red-400/20 ${btnPad}`}
                  >
                    {copied ? (
                      <Check
                        className="size-3.5 text-emerald-400"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Copy className="size-3.5" strokeWidth={2} />
                    )}
                    <span>{copied ? "Copied!" : "Copy error"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
