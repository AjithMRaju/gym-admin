'use client'
import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  Plus, 
  Pencil,
  Trash2,
  Sparkles,
  X,
  PackageOpen,
  Save,
  Loader2,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { showToast } from "../../lib/redux/slices/toastSlice"; // adjust path to your toast slice

const API_BASE = "http://localhost:8000/api/offering";

// ─── API helpers ─────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Something went wrong");
  }
  return json;
}

const fetchOfferings = () => apiFetch(API_BASE);
const createOffering = (body) =>
  apiFetch(API_BASE, { method: "POST", body: JSON.stringify(body) });
const updateOffering = (id, body) =>
  apiFetch(`${API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(body) });
const deleteOffering = (id) =>
  apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="brand-bg rounded-2xl p-5 mb-4 brand-border border">
        <PackageOpen className="w-10 h-10 " />
      </div>
      <h3 className="text-lg font-semibold mb-1">No offerings yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Start by adding your first offering. It will appear here once created.
      </p>
      <Button onClick={onAdd} className="brand-bg  gap-2">
        <Plus className="w-4 h-4" />
        Add First Offering
      </Button>
    </div>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────
function OfferingCardSkeleton() {
  return (
    <Card className="brand-border border overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  );
}

// ─── Single Offering Card ─────────────────────────────────────────────────────
function OfferingCard({ offering, onEdit, onDelete, viewMode }) {
  const isGrid = viewMode === "grid";

  return (
    <Card
      className={`
        group brand-border border transition-all duration-200
        hover:shadow-md brand-hover/5
        ${isGrid ? "" : "flex flex-row items-center"}
      `}
    >
      <CardHeader className={`${isGrid ? "" : "flex-1 pb-3"} pb-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* <div className="brand-bg brand-border border rounded-lg p-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 " />
                </div> */}
            <CardTitle className="text-sm font-semibold truncate leading-tight">
              {offering.title}
            </CardTitle>
          </div>
        
        </div>
        <CardDescription className="text-xs leading-relaxed mt-1 line-clamp-2">
          {offering.description}
        </CardDescription>
      </CardHeader>

      <CardContent
        className={`${isGrid ? "pt-0" : "pb-4 pr-4 flex items-center shrink-0"}`}
      >
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(offering)}
                  className="h-8 w-8 p-0 brand-border brand-hover transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit offering</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(offering)}
                  className="h-8 w-8 p-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Delete offering</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────
function OfferingDialog({ open, onClose, onSave, initial }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { title: initial.title, description: initial.description }
          : { title: "", description: "" }
      );
      setErrors({});
    }
  }, [open, initial]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md brand-border">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 brand-progress rounded-t-lg" />

        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="brand-bg brand-border border rounded-lg p-2">
              {isEdit ? (
                <Pencil className="w-4 h-4 " />
              ) : (
                <Plus className="w-4 h-4 " />
              )}
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? "Edit Offering" : "New Offering"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit
                  ? "Update the offering details below"
                  : "Fill in the details to create a new offering"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator className="brand-divider" />

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="offering-title" className="text-xs font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="offering-title"
              placeholder="e.g. Free Sumba Trainings"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className={`h-9 text-sm brand-focus transition-shadow ${
                errors.title ? "border-destructive focus-visible:ring-destructive" : "brand-border"
              }`}
            />
            {errors.title && (
              <p className="text-[11px] text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="offering-description"
              className="text-xs font-medium"
            >
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="offering-description"
              placeholder="Describe what this offering includes…"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={4}
              className={`text-sm resize-none brand-focus transition-shadow ${
                errors.description
                  ? "border-destructive focus-visible:ring-destructive"
                  : "brand-border"
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-destructive">
                {errors.description}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground text-right">
              {form.description.length} chars
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="brand-border"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="brand-bg  gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────
function DeleteAlert({ offering, onConfirm, onCancel, loading }) {
  return (
    <AlertDialog open={!!offering}>
      <AlertDialogContent className="brand-border sm:max-w-sm">
        
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-full bg-destructive/10 p-2.5">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <AlertDialogTitle className="text-base">
              Delete Offering?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed">
            You're about to permanently delete{" "}
            <span className="font-semibold text-foreground">
              "{offering?.title}"
            </span>
            . This action{" "}
            <span className="text-destructive font-medium">cannot be undone</span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            onClick={onCancel}
            disabled={loading}
            className="b h-8 text-sm"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive! hover:bg-destructive/90 text-white h-8 text-sm gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {loading ? "Deleting…" : "Yes, Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function OfferingsSection() {
  const dispatch = useDispatch();

  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Load ──
  const loadOfferings = useCallback(async () => {
    setLoading(true);
    try {
      const json = await fetchOfferings();
      setOfferings(json.data || []);
    } catch (err) {
      dispatch(showToast({ message: err.message, type: "error" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  // ── Create / Update ──
  const handleSave = async (form) => {
    try {
      if (editTarget) {
        await updateOffering(editTarget._id, form);
        dispatch(
          showToast({ message: "Offering updated successfully", type: "success" })
        );
      } else {
        await createOffering(form);
        dispatch(
          showToast({ message: "Offering created successfully", type: "success" })
        );
      }
      await loadOfferings();
    } catch (err) {
      dispatch(showToast({ message: err.message, type: "error" }));
      throw err; // re-throw so dialog knows to stay open
    }
  };

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteOffering(deleteTarget._id);
      dispatch(
        showToast({ message: "Offering deleted successfully", type: "success" })
      );
      setDeleteTarget(null);
      await loadOfferings();
    } catch (err) {
      dispatch(showToast({ message: err.message, type: "error" }));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (offering) => {
    setEditTarget(offering);
    setDialogOpen(true);
  };

  return (
    <div className="my-5 lg:my-10">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          
          
          <div>
            <h2 className="text-xl font-bold tracking-tight">Offerings</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {/* <ChevronRight className="w-3 h-3" /> */}
              Manage your public offerings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Count badge */}
          {/* {!loading && (
            <Badge
              variant="outline"
              className="brand-badge font-mono text-xs px-2.5"
            >
              {offerings.length} total
            </Badge>
          )} */}

          

          {/* Add button */}
          <Button
            onClick={openAdd}
            size="sm"
            className="brand-bg  gap-1.5 h-8 text-xs font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Offering
          </Button>
        </div>
      </div>

      <Separator className="brand-divider" />

      {/* ── Content ─────────────────────────────────────────────── */}
      {loading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <OfferingCardSkeleton key={i} />
          ))}
        </div>
      ) : offerings.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10"
              : "space-y-3 mt-10"
          }
        >
          {offerings.map((offering) => (
            <OfferingCard
              key={offering._id}
              offering={offering}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────── */}
      <OfferingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initial={editTarget}
      />

      <DeleteAlert
        offering={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}