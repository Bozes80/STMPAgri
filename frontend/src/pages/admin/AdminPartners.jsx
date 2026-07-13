import { Badge } from "@/components/ui/badge";
import CrudManager from "@/components/admin/CrudManager";

export default function AdminPartners() {
  return (
    <CrudManager
      testid="admin-partners"
      title="Partenaires"
      description="Gérez les partenaires affichés dans le carrousel."
      queryKey={["admin-partners"]}
      listUrl="/partners"
      mutateUrl="/admin/partners"
      emptyItem={{ name: "", type: "partenaire", logo: "", order: 0 }}
      fields={[
        { name: "name", label: "Nom du partenaire", type: "text" },
        { name: "type", label: "Type", type: "text", placeholder: "Fournisseur, Coopérative, ONG…" },
        { name: "logo", label: "URL du logo (optionnel)", type: "text", placeholder: "https://…" },
        { name: "order", label: "Ordre d'affichage", type: "number" },
      ]}
      columns={[
        { header: "Nom", render: (p) => <span className="font-medium">{p.name}</span> },
        { header: "Type", render: (p) => <Badge variant="secondary">{p.type}</Badge> },
      ]}
    />
  );
}
