import { useState, useEffect, useRef } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

type NotifType = "info" | "success" | "warning" | "danger" | "neutral"
type FilterType = "all" | "unread" | "read"

interface Notification {
  id: number
  icon: keyof typeof ICONS
  type: NotifType
  sender: string
  message: string
  time: string
  read: boolean
  tag: string
}

// ── Icons ──────────────────────────────────────────────────────────────────

const ICONS = {
  userCheck: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 stroke-current"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  ),
  star: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 stroke-current"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  alertTriangle: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 stroke-current"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  checkCircle: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 stroke-current"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  messageSquare: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 stroke-current"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  zap: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 stroke-current"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  download: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 stroke-current"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  bell: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 stroke-current"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
}

// ── Icon color map ─────────────────────────────────────────────────────────

const iconColorMap: Record<NotifType, string> = {
  info: "bg-blue-50  dark:bg-blue-950/60  text-blue-600  dark:text-blue-400",
  success:
    "bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400",
  warning:
    "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
  danger: "bg-red-50   dark:bg-red-950/60   text-red-600   dark:text-red-400",
  neutral: "bg-gray-100 dark:bg-gray-800     text-gray-500  dark:text-gray-400",
}

// ── Mock notifications ─────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    icon: "userCheck",
    type: "info",
    sender: "Alex Morgan",
    message:
      "Invited you to collaborate on the Q4 Marketing Strategy document.",
    time: "2m ago",
    read: false,
    tag: "Team",
  },
  {
    id: 2,
    icon: "star",
    type: "warning",
    sender: "Product Team",
    message:
      "Your feature request for dark mode has reached 50 upvotes and is now under review.",
    time: "18m ago",
    read: false,
    tag: "Update",
  },
  {
    id: 3,
    icon: "alertTriangle",
    type: "danger",
    sender: "System Alert",
    message:
      "Unusual login attempt detected from a new device in Berlin, Germany.",
    time: "1h ago",
    read: false,
    tag: "Security",
  },
  {
    id: 4,
    icon: "checkCircle",
    type: "success",
    sender: "Deployment Bot",
    message:
      "Your latest release v2.4.1 was deployed successfully to production.",
    time: "3h ago",
    read: false,
    tag: "DevOps",
  },
  {
    id: 5,
    icon: "messageSquare",
    type: "info",
    sender: "Sara Chen",
    message:
      'Left a comment on your pull request: "Looks good, just a few minor nits."',
    time: "5h ago",
    read: true,
    tag: "Code",
  },
  {
    id: 6,
    icon: "zap",
    type: "warning",
    sender: "Usage Monitor",
    message:
      "You've used 85% of your monthly API quota. Consider upgrading your plan.",
    time: "Yesterday",
    read: true,
    tag: "Billing",
  },
  {
    id: 7,
    icon: "download",
    type: "neutral",
    sender: "Export Service",
    message:
      "Your data export is ready. The file will be available for 48 hours.",
    time: "Yesterday",
    read: true,
    tag: "Data",
  },
]

// ── NotificationItem ───────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: number) => void
}) {
  const { id, icon, type, sender, message, time, read, tag } = notification

  return (
    <div
      onClick={() => onRead(id)}
      className={`flex cursor-pointer items-start gap-3 border-b border-gray-100 px-4 py-3.5 transition-colors duration-150 last:border-b-0 dark:border-gray-800 ${
        read
          ? "bg-white hover:bg-gray-50 dark:bg-sidebar dark:hover:bg-gray-800/60"
          : "bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
      } `}
    >
      {/* Unread dot */}
      <div className="mt-2 flex-shrink-0">
        <span
          className={`block h-2 w-2 rounded-full transition-colors ${
            read ? "bg-transparent" : "bg-blue-500"
          }`}
        />
      </div>

      {/* Icon avatar */}
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${iconColorMap[type]}`}
      >
        {ICONS[icon]}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {sender}
          </span>
          <span className="flex-shrink-0 text-xs whitespace-nowrap text-gray-400 dark:text-gray-500">
            {time}
          </span>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {message}
        </p>

        {/* Tags */}
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
              read
                ? "border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            } `}
          >
            {read ? "Read" : "Unread"}
          </span>
          <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
            {tag}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── NotificationPanel ──────────────────────────────────────────────────────
//
// Props:
//   align – "left" | "right" (default "right")
//           Controls which side the dropdown panel opens toward.
//
// Usage:
//   <NotificationPanel />
//   <NotificationPanel align="left" />

interface NotificationPanelProps {
  align?: "left" | "right"
}

export default function NotificationPanel({
  align = "right",
}: NotificationPanelProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")

  const wrapperRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : filter === "read"
        ? notifications.filter((n) => n.read)
        : notifications

  function markRead(id: number) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        open &&
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {/* ── Bell trigger button ── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className={`relative flex h-10 w-10 cursor-pointer items-center justify-center transition-all duration-150 ${
          open
            ? "border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-sidebar dark:text-white dark:hover:bg-gray-800 dark:hover:text-gray-200"
        } `}
      >
        {ICONS.bell}
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] leading-none font-bold text-white dark:border-gray-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      <div
        role="dialog"
        aria-label="Notifications"
        className={`absolute z-[1000] mt-2 w-[360px] sm:w-[400px] ${align === "right" ? "-right-[415px]" : "left-0"} overflow-hidden rounded-sm border border-gray-200 bg-white shadow-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-gray-800 dark:bg-sidebar ${align === "right" ? "origin-top-right" : "origin-top-left"} ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        } `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400 dark:hover:bg-blue-950/40"
          >
            Mark all as read
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
          {(["all", "unread", "read"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                filter === f
                  ? "border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  : "border-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              } `}
            >
              {f}
              {f === "unread" && unreadCount > 0 && (
                <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto overscroll-contain">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-gray-400 dark:text-gray-500">
              <span className="opacity-50">{ICONS.bell}</span>
              <p className="text-sm">No notifications here</p>
            </div>
          ) : (
            filtered.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={markRead} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
          <button className="brand-text cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40">
            View all activity →
          </button>
        </div>
      </div>
    </div>
  )
}
