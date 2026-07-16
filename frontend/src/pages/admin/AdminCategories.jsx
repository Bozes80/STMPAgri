import { Badge } from "@/components/ui/badge";
import CrudManager from "@/components/admin/CrudManager";

export default function AdminCategories() {
  return (
    <CrudManager
      testid="admin-categories"
      title="Catégories de produits"
      description="Créez, modifiez et organisez les catégories du catalogue."
      queryKey={["admin-categories"]}
      listUrl="/categories"
      mutateUrl="/admin/categories"
      emptyItem={{ name: "", value: "", description: "", order: 0 }}
      fields={[
        { name: "name", label: "Nom affiché", type: "text", placeholder: "Engrais, Herbicides…" },
        { name: "value", label: "Identifiant (slug)", type: "text", placeholder: "engrais, herbicides… (minuscules, sans espace)" },
        { name: "description", label: "Description (optionnel)", type: "textarea" },
        { name: "order", label: "Ordre d'affichage", type: "number" },
      ]}
      columns={[
        { header: "Nom", render: (c) => <span className="font-medium">{c.name}</span> },
        { header: "Slug", render: (c) => <Badge variant="secondary" className="font-mono text-xs">{c.value}</Badge> },
        { header: "Ordre", render: (c) => <span className="text-sm text-muted-foreground">{c.order ?? 0}</span> },
        { header: "Description", render: (c) => <span className="text-sm text-muted-foreground line-clamp-1">{c.description || "—"}</span> },
      ]}
    />
  );
}
