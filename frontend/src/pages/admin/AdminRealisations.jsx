import { Badge } from "@/components/ui/badge";
import CrudManager from "@/components/admin/CrudManager";

export default function AdminRealisations() {
  return (
    <CrudManager
      testid="admin-realisations"
      title="Réalisations"
      description="Mettez en avant vos projets et opérations réussies."
      queryKey={["admin-realisations"]}
      listUrl="/realisations"
      mutateUrl="/admin/realisations"
      emptyItem={{ title: "", category: "logistique", description: "", image: "", location: "", year: "", order: 0 }}
      fields={[
        { name: "title", label: "Titre", type: "text" },
        { name: "category", label: "Catégorie", type: "text", placeholder: "logistique, import, partenariat…" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image", label: "URL de l'image", type: "text", placeholder: "https://…" },
        { name: "location", label: "Lieu", type: "text" },
        { name: "year", label: "Année", type: "text" },
        { name: "order", label: "Ordre d'affichage", type: "number" },
      ]}
      columns={[
        { header: "Image", render: (r) => <img src={r.image} alt="" className="h-11 w-16 rounded-md object-cover" /> },
        { header: "Titre", render: (r) => <span className="font-medium line-clamp-1">{r.title}</span> },
        { header: "Catégorie", render: (r) => <Badge variant="secondary" className="capitalize">{r.category}</Badge> },
        { header: "Année", render: (r) => <span className="text-sm text-muted-foreground">{r.year || "—"}</span> },
      ]}
    />
  );
}
