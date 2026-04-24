export function PlanCard({ plan, onEdit, onDelete, onToggleActive }) {
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