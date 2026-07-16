import { useRef, useState } from "react";
import { Upload, Loader2, X, ExternalLink, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import api, { formatApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/media";

export default function GalleryField({ value = [], onChange, testid = "gallery" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`«${file.name}» trop volumineux (max 10 Mo).`);
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/admin/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploaded.push(data.url);
      }
      if (uploaded.length) {
        onChange?.([...(value || []), ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} ajoutée${uploaded.length > 1 ? "s" : ""}.`);
      }
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = (idx) => onChange?.(value.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const next = [...value];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange?.(next);
  };

  return (
    <div className="space-y-3" data-testid={testid}>
      {value?.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-lg border border-border bg-muted/40">
              <img src={resolveImageUrl(url)} alt="" className="w-full aspect-video object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                    className="h-6 w-6 grid place-items-center rounded text-white/80 hover:bg-white/10 disabled:opacity-30" title="Déplacer avant">
                    <GripVertical className="h-3 w-3 rotate-90" />
                  </button>
                  <span className="text-xs text-white/70">#{i + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => window.open(resolveImageUrl(url), "_blank")}
                    className="h-6 w-6 grid place-items-center rounded text-white/80 hover:bg-white/10" title="Voir">
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => remove(i)}
                    data-testid={`${testid}-remove-${i}`}
                    className="h-6 w-6 grid place-items-center rounded text-red-300 hover:bg-white/10" title="Retirer">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        data-testid={`${testid}-upload-btn`}
        className="w-full h-20 border-dashed"
      >
        {uploading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Téléversement…</>
                   : <><Upload className="h-5 w-5 mr-2" /> Ajouter à la galerie (multi-sélection possible)</>}
      </Button>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
        className="hidden"
        data-testid={`${testid}-file-input`}
      />
    </div>
  );
}
