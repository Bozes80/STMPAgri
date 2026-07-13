import { Badge } from "@/components/ui/badge";
import CrudManager from "@/components/admin/CrudManager";
import { ARTICLE_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/components/ArticleCard";

const options = ARTICLE_CATEGORIES.filter((c) => c.value !== "all");
const label = (v) => options.find((o) => o.value === v)?.label || v;

export default function AdminArticles() {
  return (
    <CrudManager
      testid="admin-articles"
      title="Actualités"
      description="Publiez et gérez les articles du blog STMP Agri."
      queryKey={["admin-articles"]}
      listUrl="/admin/articles"
      mutateUrl="/admin/articles"
      emptyItem={{
        title: "", category: "conseils", excerpt: "", content: "",
        image: "", author: "STMP Agri", published: true,
      }}
      fields={[
        { name: "title", label: "Titre", type: "text" },
        { name: "category", label: "Catégorie", type: "select", options },
        { name: "excerpt", label: "Résumé", type: "textarea", rows: 2 },
        { name: "content", label: "Contenu de l'article", type: "textarea", rows: 8, placeholder: "Séparez les paragraphes par des retours à la ligne." },
        { name: "image", label: "URL de l'image", type: "text", placeholder: "https://…" },
        { name: "author", label: "Auteur", type: "text" },
        { name: "published", label: "Publier l'article", type: "checkbox", hint: "Visible sur le site" },
      ]}
      columns={[
        { header: "Titre", render: (a) => <span className="font-medium line-clamp-1">{a.title}</span> },
        { header: "Catégorie", render: (a) => <Badge variant="secondary">{label(a.category)}</Badge> },
        { header: "Statut", render: (a) => (a.published ? <Badge className="bg-[#0E7A3A] text-white hover:bg-[#0E7A3A]">Publié</Badge> : <Badge variant="outline">Brouillon</Badge>) },
        { header: "Date", render: (a) => <span className="text-sm text-muted-foreground">{formatDate(a.created_at)}</span> },
      ]}
    />
  );
}
