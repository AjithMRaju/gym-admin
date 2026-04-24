/**
 * MembershipPlans.jsx
 * Admin panel component for managing gym membership plans
 * Supports: Create, Read, Update, Delete, Toggle Active status
 */

'use client'
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Star, StarOff, CheckCircle2,
  Clock, Crown, Zap, ChevronDown, X, Loader2, Dumbbell
} from "lucide-react";
import { useDispatch } from "react-redux";
import { showToast } from "../../lib/redux/slices/toastSlice"; // adjust path as needed
import axiosInstance from "@/lib/config/axiosConfig"; // adjust path as needed

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const DURATION_UNITS = ["days", "months", "years"];

const UNIT_ICON = {
  days: <Clock className="h-3.5 w-3.5" />,
  months: <Zap className="h-3.5 w-3.5" />,
  years: <Crown className="h-3.5 w-3.5" />,
};

const EMPTY_FORM = {
  name: "",
  price: "",
  duration: "",
  durationUnit: "months",
  description: "",
  features: "",   // comma-separated string in form; converted to array on submit
  highlight: false,
  isActive: true,
};

/* ─── Helper ─────────────────────────────────────────────────────────────── */
const planAccent = (plan) => {
  if (plan.highlight) return "from-amber-500/20 to-amber-600/5 border-amber-500/40";
  if (plan.durationUnit === "years") return "from-violet-500/20 to-violet-600/5 border-violet-500/30";
  if (plan.durationUnit === "days") return "from-sky-500/20 to-sky-600/5 border-sky-500/30";
  return "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30";
};

/* ═══════════════════════════════════════════════════════════════════════════
   MembershipPlans Component
═══════════════════════════════════════════════════════════════════════════ */
export default function MembershipPlans() {
  const dispatch = useDispatch();

  /* ── State ── */
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch Plans ── */
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/membership/plans");
      setPlans(data.data || []);
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Failed to load plans", type: "error" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  /* ── Open Modal ── */
  const openCreate = () => {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      durationUnit: plan.durationUnit,
      description: plan.description || "",
      features: (plan.features || []).join(", "),
      highlight: plan.highlight || false,
      isActive: plan.isActive ?? true,
    });
    setModalOpen(true);
  };

  /* ── Form Change ── */
  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  /* ── Submit ── */
  const handleSubmit = async () => {
    const { name, price, duration, durationUnit } = form;
    if (!name || !price || !duration || !durationUnit) {
      dispatch(showToast({ message: "Name, price, duration and unit are required.", type: "error" }));
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      price: parseFloat(form.price),
      duration: parseInt(form.duration),
      features: form.features
        ? form.features.split(",").map((f) => f.trim()).filter(Boolean)
        : [],
    };
    try {
      if (editingPlan) {
        // Update
        const { data } = await axiosInstance.put(`/membership/plans/${editingPlan._id}`, payload);
        setPlans((prev) => prev.map((p) => (p._id === editingPlan._id ? data.data : p)));
        dispatch(showToast({ message: "Plan updated successfully!", type: "success" }));
      } else {
        // Create
        const { data } = await axiosInstance.post("/membership/plans", payload);
        setPlans((prev) => [...prev, data.data]);
        dispatch(showToast({ message: "Plan created successfully!", type: "success" }));
      }
      setModalOpen(false);
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Operation failed", type: "error" }));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/membership/plans/${deleteTarget._id}`);
      setPlans((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      dispatch(showToast({ message: "Plan deleted.", type: "success" }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Delete failed", type: "error" }));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ── Toggle Active (quick update) ── */
  const toggleActive = async (plan) => {
    try {
      const { data } = await axiosInstance.put(`/membership/plans/${plan._id}`, {
        isActive: !plan.isActive,
      });
      setPlans((prev) => prev.map((p) => (p._id === plan._id ? data.data : p)));
      dispatch(showToast({ message: `Plan ${data.data.isActive ? "activated" : "deactivated"}.`, type: "success" }));
    } catch (err) {
      dispatch(showToast({ message: "Toggle failed", type: "error" }));
    }
  };

  /* ── Render ── */
  return (
    <div className="space-y-6 my-5 lg:my-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Membership Plans</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Manage your gym's pricing tiers</p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 h-64 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Dumbbell className="h-12 w-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-lg font-medium">No plans yet</p>
          <p className="text-zinc-600 text-sm mt-1">Create your first membership plan to get started.</p>
          <Button onClick={openCreate} variant="outline" className="mt-5 border-white/10 text-white hover:bg-white/5 gap-2">
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        </div>
      )}

      {/* Plans grid */}
      {!loading && plans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onEdit={() => openEdit(plan)}
              onDelete={() => setDeleteTarget(plan)}
              onToggleActive={() => toggleActive(plan)}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingPlan ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Plan Name <span className="text-red-400">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Pro Monthly"
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
              />
            </div>

            {/* Price + Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Price ($) <span className="text-red-400">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="0.00"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Duration <span className="text-red-400">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={(e) => handleChange("duration", e.target.value)}
                    placeholder="1"
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 w-20"
                  />
                  <Select value={form.durationUnit} onValueChange={(v) => handleChange("durationUnit", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      {DURATION_UNITS.map((u) => (
                        <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Short tagline for this plan"
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 resize-none"
              />
            </div>

            {/* Features */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Features <span className="text-zinc-500 font-normal">(comma-separated)</span></Label>
              <Textarea
                value={form.features}
                onChange={(e) => handleChange("features", e.target.value)}
                placeholder="Access to gym, Locker room, 2 Guest passes"
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 resize-none"
              />
            </div>

            {/* Toggles */}
            <div className="flex gap-6 pt-1">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.highlight}
                  onCheckedChange={(v) => handleChange("highlight", v)}
                  className="data-[state=checked]:bg-amber-500"
                />
                <Label className="text-zinc-300 cursor-pointer">Featured / Highlight</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => handleChange("isActive", v)}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <Label className="text-zinc-300 cursor-pointer">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingPlan ? "Save Changes" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-sidebar border-white/10   ">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. Existing subscriptions on this plan will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600! hover:bg-red-500 text-white gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── PlanCard ────────────────────────────────────────────────────────────── */
function PlanCard({ plan, onEdit, onDelete, onToggleActive }) {
  return (
    <div
      className={`
        relative rounded border bg-gradient-to-br p-5 flex flex-col gap-4
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30
        ${planAccent(plan)}
        ${!plan.isActive ? "opacity-50 grayscale" : ""}
      `}
    >
      {/* Highlight badge */}
      {plan.highlight && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-black shadow">
          <Star className="h-3 w-3 fill-black" /> Featured
        </span>
      )}

      {/* Plan header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-white text-lg leading-tight">{plan.name}</h3>
          {plan.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{plan.description}</p>
          )}
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 border capitalize flex items-center gap-1 text-xs font-medium
            ${plan.isActive ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-zinc-600 text-zinc-500"}
          `}
        >
          {plan.isActive ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {plan.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Price + Duration */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-extrabold text-white">${plan.price}</span>
        <span className="text-zinc-400 text-sm mb-0.5 flex items-center gap-1">
          {UNIT_ICON[plan.durationUnit]}
          {plan.duration} {plan.durationUnit}
        </span>
      </div>

      {/* Features */}
      {plan.features?.length > 0 && (
        <ul className="space-y-1.5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/10">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleActive}
          className="text-zinc-400 hover:text-white hover:bg-white/5 h-8 px-3 gap-1.5 text-xs"
        >
          {plan.isActive ? <StarOff className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {plan.isActive ? "Deactivate" : "Activate"}
        </Button>
        <div className="flex gap-1 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}