import { useState } from "react";
import { Pencil, Trash2, GripVertical, ChevronRight, ExternalLink } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Ligne triable pour un item de menu. Utilise @dnd-kit/sortable.
 * Rendue à sa profondeur (`depth`) via un padding gauche.
 */
export default function SortableMenuItem({ item, parent, depth = 0, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: 12 + depth * 24,
  };

  const isExternal = /^https?:\/\//i.test(item.url || "");

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`menu-item-${item.id}`}
      className="flex items-center gap-2 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors py-2 pr-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        title="Déplacer"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {depth > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{item.label}</span>
          {item.target === "_blank" && <Badge variant="secondary" className="text-[10px] py-0 h-4">Nouvel onglet</Badge>}
          {isExternal && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
        </div>
        <span className="text-xs text-muted-foreground font-mono block truncate">{item.url || "—"}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onEdit(item)} data-testid={`menu-item-edit-${item.id}`}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(item)} data-testid={`menu-item-delete-${item.id}`}
          className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
