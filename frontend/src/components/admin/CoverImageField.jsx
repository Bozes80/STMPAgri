import { useRef, useState } from "react";
import { Upload, Loader2, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api, { formatApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/media";

/** Champ image simple (upload + URL + preview) — plus léger que ImageField du CrudManager. */
export default function CoverImageField({ value = "", onChange, testid = "cover", aspect = "video" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Fichier trop volumineux (max 10 Mo).");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange?.(data.url);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const preview = resolveImageUrl(value);
  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-[16/9]";

  return (
    <div className="space-y-2" data-testid={testid}>
      {preview ? (
        <div className={`relative overflow-hidden rounded-lg border border-border ${aspectClass}`}>
          <img src={preview} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid={`${testid}-replace-btn`}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
              Remplacer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.open(preview, "_blank")}><ExternalLink className="h-3.5 w-3.5 mr-1" /> Voir</Button>
            <Button size="sm" variant="destructive" onClick={() => onChange?.("")} data-testid={`${testid}-clear-btn`}><X className="h-3.5 w-3.5 mr-1" /> Retirer</Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}
          data-testid={`${testid}-upload-btn`} className={`w-full ${aspectClass} border-dashed flex-col`}>
          {uploading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Téléversement…</> : <><Upload className="h-5 w-5 mr-2" /> Téléverser une image de couverture</>}
        </Button>
      )}
      <Input value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} placeholder="URL personnalisée ou téléversez ci-dessus" className="text-xs" data-testid={`${testid}-url-input`} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handle} className="hidden" data-testid={`${testid}-file-input`} />
    </div>
  );
}
