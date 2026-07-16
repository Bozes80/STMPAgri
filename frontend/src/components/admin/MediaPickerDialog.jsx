import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Upload, Loader2, Check, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api, { formatApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/media";

const SECTIONS = [
  { value: "all",     label: "Toutes" },
  { value: "header",  label: "Header" },
  { value: "content", label: "Contenu" },
  { value: "footer",  label: "Footer" },
];

/**
 * Modal de sélection d'image depuis la médiathèque.
 * Props:
 *  - open, onOpenChange
 *  - onSelect(url)              — appelé avec l'URL relative /api/files/... choisie
 *  - defaultSection             — section pré-sélectionnée pour l'onglet & l'upload direct
 *  - allowUpload (defaults true)— autoriser upload direct depuis la modal
 */
export default function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  defaultSection = "content",
  allowUpload = true,
  testid = "media-picker",
}) {
  const qc = useQueryClient();
  const [section, setSection] = useState(defaultSection || "all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSection(defaultSection || "all");
      setQ("");
      setSelectedId(null);
    }
  }, [open, defaultSection]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["media", section, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (section && section !== "all") params.set("section", section);
      if (q.trim()) params.set("q", q.trim());
      const { data } = await api.get(`/admin/media?${params.toString()}`);
      return data || [];
    },
    enabled: open,
  });

  const filtered = data;

  const doUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Fichier trop volumineux (max 10 Mo).");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const sec = section === "all" ? (defaultSection || "content") : section;
      const params = new URLSearchParams({ section: sec, title: file.name });
      const { data: created } = await api.post(`/admin/media?${params.toString()}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Image téléversée.");
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-counts"] });
      setSelectedId(created.id);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const selected = useMemo(
    () => filtered.find((m) => m.id === selectedId),
    [filtered, selectedId]
  );

  const confirm = () => {
    if (!selected) return toast.error("Sélectionnez une image d'abord.");
    onSelect?.(selected.url, selected);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" data-testid={testid}>
        <DialogHeader>
          <DialogTitle>Médiathèque</DialogTitle>
          <DialogDescription>Choisissez une image existante ou téléversez-en une nouvelle.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center border-b pb-3">
          <Tabs value={section} onValueChange={setSection} className="w-full md:w-auto">
            <TabsList data-testid={`${testid}-tabs`}>
              {SECTIONS.map((s) => (
                <TabsTrigger key={s.value} value={s.value} data-testid={`${testid}-tab-${s.value}`}>
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (titre, alt, tag…)"
              className="pl-9"
              data-testid={`${testid}-search`} />
          </div>
          {allowUpload && (
            <>
              <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
                data-testid={`${testid}-upload-btn`}>
                {uploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
                {uploading ? "Téléversement…" : "Téléverser"}
              </Button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={(e) => doUpload(e.target.files?.[0])}
                className="hidden" data-testid={`${testid}-file-input`} />
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3" data-testid={`${testid}-grid`}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#0E7A3A]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground" data-testid={`${testid}-empty`}>
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune image. Téléversez-en une pour commencer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((m) => {
                const active = selectedId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    onDoubleClick={() => { setSelectedId(m.id); confirm(); }}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition
                      ${active ? "border-[#0E7A3A] ring-2 ring-[#0E7A3A]/30" : "border-border hover:border-[#0E7A3A]/50"}`}
                    data-testid={`${testid}-item-${m.id}`}
                    title={m.title || m.filename}
                  >
                    <img src={resolveImageUrl(m.url)} alt={m.alt || m.title}
                      className="w-full h-full object-cover" loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="text-[10px] font-semibold text-white truncate">{m.title || m.filename}</div>
                      <div className="text-[9px] text-white/70 uppercase tracking-wide">{m.section}</div>
                    </div>
                    {active && (
                      <div className="absolute top-2 right-2 bg-[#0E7A3A] text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex-col sm:flex-row gap-2">
          <div className="mr-auto text-xs text-muted-foreground">
            {selected ? `Sélection : ${selected.title || selected.filename}` : `${filtered.length} image${filtered.length > 1 ? "s" : ""} disponible${filtered.length > 1 ? "s" : ""}`}
          </div>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} data-testid={`${testid}-cancel`}>
            Annuler
          </Button>
          <Button type="button" onClick={confirm} disabled={!selected}
            className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
            data-testid={`${testid}-confirm`}>
            Choisir cette image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
