import { Badge } from "@/components/ui/badge";
import CrudManager from "@/components/admin/CrudManager";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const options = PRODUCT_CATEGORIES.filter((c) => c.value !== "all");
const label = (v) => options.find((o) => o.value === v)?.label || v;

export default function AdminProducts() {
  return (
    <CrudManager
      testid="admin-products"
      title="Produits"
      description="Gérez votre catalogue d'intrants et d'équipements agricoles."
      queryKey={["admin-products"]}
      listUrl="/products"
      mutateUrl="/admin/products"
      emptyItem={{
        name: "", category: "engrais", subcategory: "", description: "",
        characteristics: "", applications: "", image: "", featured: false, order: 0,
      }}
      fields={[
        { name: "name", label: "Nom du produit", type: "text" },
        { name: "category", label: "Catégorie", type: "select", options },
        { name: "subcategory", label: "Sous-catégorie (optionnel)", type: "text" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "characteristics", label: "Caractéristiques techniques", type: "list", placeholder: "Une caractéristique par ligne" },
        { name: "applications", label: "Domaines d'application", type: "list", placeholder: "Une application par ligne" },
        { name: "image", label: "URL de l'image", type: "text", placeholder: "https://…" },
        { name: "featured", label: "Produit mis en avant", type: "checkbox", hint: "Afficher sur la page d'accueil" },
        { name: "order", label: "Ordre d'affichage", type: "number" },
      ]}
      columns={[
        { header: "Image", render: (p) => <img src={p.image} alt="" className="h-11 w-11 rounded-md object-cover" /> },
        { header: "Nom", render: (p) => <span className="font-medium">{p.name}</span> },
        { header: "Catégorie", render: (p) => <Badge variant="secondary">{label(p.category)}</Badge> },
        { header: "Vedette", render: (p) => (p.featured ? <Badge className="bg-[#F2D400] text-[#1F2937] hover:bg-[#F2D400]">Oui</Badge> : <span className="text-muted-foreground">—</span>) },
      ]}
    />
  );
}
