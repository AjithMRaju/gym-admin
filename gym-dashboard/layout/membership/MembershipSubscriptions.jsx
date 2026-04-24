'use client'
/**
 * MembershipSubscriptions.jsx
 * Admin panel component for managing gym member subscriptions
 * Supports: List (paginated + filtered), Assign, View detail, Change status, Expiring soon
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Filter, Eye, RefreshCcw, ChevronLeft, ChevronRight,
  AlertTriangle, Calendar, CreditCard, Loader2, Users, X,
  CheckCircle2, PauseCircle, XCircle, Clock
} from "lucide-react";
import { useDispatch } from "react-redux";
import { showToast } from "../../lib/redux/slices/toastSlice";
import axiosInstance from "@/lib/config/axiosConfig";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const STATUS_OPTIONS = ["active", "paused", "cancelled", "expired"];
const PAYMENT_METHODS = ["cash", "card", "upi", "bank_transfer", "other"];
const PAGE_LIMIT = 10;

const STATUS_CONFIG = {
  active:    { label: "Active",    icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  paused:    { label: "Paused",    icon: <PauseCircle  className="h-3.5 w-3.5" />, cls: "bg-amber-500/15  text-amber-400  border-amber-500/30"  },
  cancelled: { label: "Cancelled", icon: <XCircle      className="h-3.5 w-3.5" />, cls: "bg-red-500/15    text-red-400    border-red-500/30"    },
  expired:   { label: "Expired",   icon: <Clock        className="h-3.5 w-3.5" />, cls: "bg-zinc-500/15  text-zinc-400   border-zinc-500/30"   },
};

const EMPTY_ASSIGN = {
  clientId: "", clientName: "",
  planId: "", startDate: "", paymentMethod: "cash", amountPaid: "", notes: "",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const daysLeft = (end) => {
  const diff = Math.ceil((new Date(end) - new Date()) / 86_400_000);
  return diff;
};

/* ═══════════════════════════════════════════════════════════════════════════
   MembershipSubscriptions Component
═══════════════════════════════════════════════════════════════════════════ */
export default function MembershipSubscriptions() {
  const dispatch = useDispatch();

  /* ── Data State ── */
  const [subs, setSubs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [expiring, setExpiring] = useState([]);

  /* ── Pagination & Filters ── */
  const [page, setPage]               = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // client name search (client-side)

  /* ── Assign modal ── */
  const [assignOpen, setAssignOpen] = useState(false);
  const [plans, setPlans]           = useState([]);
  const [form, setForm]             = useState(EMPTY_ASSIGN);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState([]);
  const [clientSearching, setClientSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ── Detail sheet ── */
  const [detailSub, setDetailSub]   = useState(null);
  const [statusChanging, setStatusChanging] = useState(false);

  /* ── Expiring panel toggle ── */
  const [showExpiring, setShowExpiring] = useState(false);

  /* ─── Fetch subscriptions ─────────────────────────────────────────────── */
  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_LIMIT });
      if (filterStatus) params.append("status", filterStatus);

      const { data } = await axiosInstance.get(`/membership/subscriptions?${params}`);
      setSubs(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Failed to load subscriptions", type: "error" }));
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, dispatch]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  /* ─── Fetch expiring memberships ─────────────────────────────────────── */
  const fetchExpiring = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/membership/expiring?days=7");
      
      
      setExpiring(data.data || []);
    } catch (_) { /* silent */ }
  }, []);

  useEffect(() => { fetchExpiring(); }, [fetchExpiring]);

  /* ─── Fetch plans for assign modal ───────────────────────────────────── */
  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/membership/plans");
      setPlans(data.data || []);
    } catch (_) { /* silent */ }
  }, []);

  useEffect(() => { if (assignOpen) fetchPlans(); }, [assignOpen, fetchPlans]);

  /* ─── Client search (debounced) ──────────────────────────────────────── */
  useEffect(() => {
    if (!clientSearch.trim()) { setClientResults([]); return; }
    const t = setTimeout(async () => {
      setClientSearching(true);
      try {
        // Adjust endpoint to your actual client search API
        const { data } = await axiosInstance.get(`/clients?search=${clientSearch}&limit=8`);
        setClientResults(data.data || []);
      } catch (_) { setClientResults([]); }
      finally { setClientSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [clientSearch]);

  /* ─── Assign subscription ────────────────────────────────────────────── */
  const handleAssign = async () => {
    const { clientId, planId, startDate, paymentMethod } = form;
    if (!clientId || !planId || !startDate || !paymentMethod) {
      dispatch(showToast({ message: "Client, plan, start date and payment method are required.", type: "error" }));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        clientId,
        planId,
        startDate,
        paymentMethod,
        amountPaid: form.amountPaid ? parseFloat(form.amountPaid) : undefined,
        notes: form.notes || undefined,
      };
      await axiosInstance.post("/membership/subscriptions", payload);
      dispatch(showToast({ message: "Membership assigned successfully!", type: "success" }));
      setAssignOpen(false);
      setForm(EMPTY_ASSIGN);
      setClientSearch("");
      setClientResults([]);
      fetchSubs();
      fetchExpiring();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Assignment failed", type: "error" }));
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Change subscription status ─────────────────────────────────────── */
  const changeStatus = async (id, status) => {
    setStatusChanging(true);
    try {
      const { data } = await axiosInstance.patch(`/membership/subscriptions/${id}/status`, { status });
      setSubs((prev) => prev.map((s) => (s._id === id ? { ...s, status: data.data.status } : s)));
      if (detailSub?._id === id) setDetailSub((d) => ({ ...d, status: data.data.status }));
      dispatch(showToast({ message: `Status changed to ${status}.`, type: "success" }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Status update failed", type: "error" }));
    } finally {
      setStatusChanging(false);
    }
  };

  /* ─── Pagination helpers ─────────────────────────────────────────────── */
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  /* ─── Client-side search filter ─────────────────────────────────────── */
  const displayedSubs = searchQuery
    ? subs.filter((s) =>
        s.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.client?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : subs;

  /* ── Render ── */
  return (
    <div className="space-y-6 my-5 lg:my-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Subscriptions</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            {total} total memberships
            {expiring.length > 0 && (
              <button
                onClick={() => setShowExpiring(true)}
                className="ml-3 inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-medium"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {expiring.length} expiring soon
              </button>
            )}
          </p>
        </div>
        <Button
          onClick={() => setAssignOpen(true)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Assign Membership
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client name, email…"
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select
          value={filterStatus || "all"}
          onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white w-44! gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10 text-white">
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => { fetchSubs(); fetchExpiring(); }}
          className="text-zinc-400 hover:text-white hover:bg-white/5 shrink-0"
          title="Refresh"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-medium">Member</TableHead>
              <TableHead className="text-zinc-400 font-medium">Plan</TableHead>
              <TableHead className="text-zinc-400 font-medium hidden md:table-cell">Start</TableHead>
              <TableHead className="text-zinc-400 font-medium hidden md:table-cell">Ends</TableHead>
              <TableHead className="text-zinc-400 font-medium">Status</TableHead>
              <TableHead className="text-zinc-400 font-medium hidden lg:table-cell">Payment</TableHead>
              <TableHead className="text-zinc-400 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading subscriptions…
                </TableCell>
              </TableRow>
            )}

            {!loading && displayedSubs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-500">
                  <Users className="h-8 w-8 mx-auto mb-3 text-zinc-700" />
                  No subscriptions found
                </TableCell>
              </TableRow>
            )}

            {!loading && displayedSubs.map((sub) => {
              const days = sub.endDate ? daysLeft(sub.endDate) : null;
              const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG.expired;
              return (
                <TableRow
                  key={sub._id}
                  className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setDetailSub(sub)}
                >
                  {/* Member */}
                  <TableCell>
                    <div className="font-medium text-white text-sm">{sub.client?.name || "—"}</div>
                    <div className="text-xs text-zinc-500">{sub.client?.email || sub.client?.phone || ""}</div>
                  </TableCell>

                  {/* Plan */}
                  <TableCell>
                    <div className="text-sm text-white font-medium">{sub.plan?.name || "—"}</div>
                    <div className="text-xs text-zinc-500">${sub.plan?.price} / {sub.plan?.duration} {sub.plan?.durationUnit}</div>
                  </TableCell>

                  {/* Start */}
                  <TableCell className="text-zinc-300 text-sm hidden md:table-cell">{fmt(sub.startDate)}</TableCell>

                  {/* End / Days left */}
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm text-zinc-300">{fmt(sub.endDate)}</div>
                    {sub.status === "active" && days !== null && days <= 7 && days >= 0 && (
                      <div className="text-xs text-amber-400 font-medium mt-0.5">{days}d left</div>
                    )}
                    {sub.status === "active" && days !== null && days < 0 && (
                      <div className="text-xs text-red-400 font-medium mt-0.5">Overdue</div>
                    )}
                  </TableCell>

                  {/* Status badge */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`inline-flex items-center gap-1 text-xs font-medium capitalize border ${sc.cls}`}
                    >
                      {sc.icon} {sc.label}
                    </Badge>
                  </TableCell>

                  {/* Payment */}
                  <TableCell className="text-zinc-400 text-sm capitalize hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      {sub.paymentMethod}
                    </div>
                    <div className="text-xs text-zinc-500">${sub.amountPaid}</div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDetailSub(sub)}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-sm text-zinc-500">
            Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page number pills */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-zinc-600 text-sm">…</span>
                ) : (
                  <Button
                    key={item}
                    size="sm"
                    variant={page === item ? "default" : "ghost"}
                    onClick={() => setPage(item)}
                    className={`h-8 w-8 p-0 text-sm font-medium ${
                      page === item
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item}
                  </Button>
                )
              )}

            <Button
              size="sm"
              variant="ghost"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          Assign Membership Modal
      ═══════════════════════════════════════════ */}
      <Dialog open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) { setClientSearch(""); setClientResults([]); setForm(EMPTY_ASSIGN); } }}>
        <DialogContent className="bg-sidebar border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Assign Membership</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Client search */}
            <div className="space-y-1.5 relative">
              <Label className="text-zinc-300">Member <span className="text-red-400">*</span></Label>
              {form.clientId ? (
                <div className="flex items-center justify-between rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-3 py-2">
                  <span className="text-white font-medium text-sm">{form.clientName}</span>
                  <button
                    onClick={() => { setForm((f) => ({ ...f, clientId: "", clientName: "" })); setClientSearch(""); }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search by name or email…"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                    />
                    {clientSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-500" />}
                  </div>
                  {clientResults.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-lg border border-white/10 bg-zinc-900 shadow-xl overflow-hidden">
                      {clientResults.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => {
                            setForm((f) => ({ ...f, clientId: c._id, clientName: c.name }));
                            setClientSearch("");
                            setClientResults([]);
                          }}
                          className="w-full flex flex-col items-start px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                        >
                          <span className="text-sm text-white font-medium">{c.name}</span>
                          <span className="text-xs text-zinc-500">{c.email || c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Plan select */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Plan <span className="text-red-400">*</span></Label>
              <Select value={form.planId} onValueChange={(v) => {
                const selected = plans.find((p) => p._id === v);
                setForm((f) => ({ ...f, planId: v, amountPaid: selected?.price || "" }));
              }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {plans.filter((p) => p.isActive).map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} — ${p.price} / {p.duration} {p.durationUnit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date + Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Start Date <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Payment <span className="text-red-400">*</span></Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount paid */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Amount Paid ($)</Label>
              <Input
                type="number"
                min="0"
                value={form.amountPaid}
                onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))}
                placeholder="Auto-filled from plan"
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAssignOpen(false)} className="text-zinc-400 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════
          Expiring Soon Panel
      ═══════════════════════════════════════════ */}
      <Dialog open={showExpiring} onOpenChange={setShowExpiring}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Expiring in Next 7 Days
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto py-1 pr-1">
            {expiring.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">No memberships expiring soon 🎉</p>
            ) : expiring.map((sub) => (
              <div key={sub._id} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{sub.client?.name}</p>
                  <p className="text-xs text-zinc-400">{sub.plan?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-400 font-semibold">{daysLeft(sub.endDate)}d left</p>
                  <p className="text-xs text-zinc-500">{fmt(sub.endDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════
          Detail / Status Sheet
      ═══════════════════════════════════════════ */}
      <Sheet open={!!detailSub} onOpenChange={(o) => !o && setDetailSub(null)}>
        <SheetContent className="bg-zinc-950 border-white/10 text-white w-full sm:max-w-md lg:max-w-lg!">
          {detailSub && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-white text-xl font-bold">Subscription Detail</SheetTitle>
              </SheetHeader>

              <div className="space-y-5">
                {/* Status badge */}
                {(() => {
                  const sc = STATUS_CONFIG[detailSub.status] || STATUS_CONFIG.expired;
                  return (
                    <Badge variant="outline" className={`inline-flex items-center gap-1.5 text-sm font-medium capitalize border px-3 py-1 ${sc.cls}`}>
                      {sc.icon} {sc.label}
                    </Badge>
                  );
                })()}

                {/* Member info */}
                <InfoBlock label="Member">
                  <p className="text-white font-semibold">{detailSub.client?.name}</p>
                  <p className="text-zinc-400 text-sm">{detailSub.client?.email}</p>
                  <p className="text-zinc-400 text-sm">{detailSub.client?.phone}</p>
                </InfoBlock>

                {/* Plan info */}
                <InfoBlock label="Plan">
                  <p className="text-white font-semibold">{detailSub.plan?.name}</p>
                  <p className="text-zinc-400 text-sm">${detailSub.plan?.price} / {detailSub.plan?.duration} {detailSub.plan?.durationUnit}</p>
                </InfoBlock>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoBlock label="Start Date"><p className="text-white">{fmt(detailSub.startDate)}</p></InfoBlock>
                  <InfoBlock label="End Date">
                    <p className="text-white">{fmt(detailSub.endDate)}</p>
                    {detailSub.status === "active" && (
                      <p className={`text-xs mt-0.5 font-medium ${daysLeft(detailSub.endDate) <= 7 ? "text-amber-400" : "text-zinc-500"}`}>
                        {daysLeft(detailSub.endDate) >= 0 ? `${daysLeft(detailSub.endDate)} days remaining` : "Overdue"}
                      </p>
                    )}
                  </InfoBlock>
                </div>

                {/* Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoBlock label="Payment Method"><p className="text-white capitalize">{detailSub.paymentMethod?.replace("_", " ")}</p></InfoBlock>
                  <InfoBlock label="Amount Paid"><p className="text-white">${detailSub.amountPaid}</p></InfoBlock>
                </div>

                {/* Notes */}
                {detailSub.notes && (
                  <InfoBlock label="Notes"><p className="text-zinc-300 text-sm">{detailSub.notes}</p></InfoBlock>
                )}

                {/* Change Status */}
                <div className="space-y-2 pt-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Change Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.filter((s) => s !== detailSub.status).map((s) => {
                      const sc = STATUS_CONFIG[s];
                      return (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          disabled={statusChanging}
                          onClick={() => changeStatus(detailSub._id, s)}
                          className={`border capitalize gap-1.5 ${sc.cls} hover:opacity-80`}
                        >
                          {sc.icon} {sc.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ─── Small helper block ─────────────────────────────────────────────────── */
function InfoBlock({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">{label}</p>
      {children}
    </div>
  );
}