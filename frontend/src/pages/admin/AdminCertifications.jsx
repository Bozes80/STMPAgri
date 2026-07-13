import CrudManager from "@/components/admin/CrudManager";

export default function AdminCertifications() {
  return (
    <CrudManager
      testid="admin-certifications"
      title="Certifications"
      description="Gérez vos agréments, certifications et documents de conformité."
      queryKey={["admin-certifications"]}
      listUrl="/certifications"
      mutateUrl="/admin/certifications"
      emptyItem={{ title: "", issuer: "", description: "", year: "", pdf_url: "", order: 0 }}
      fields={[
        { name: "title", label: "Intitulé", type: "text" },
        { name: "issuer", label: "Organisme émetteur", type: "text" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "year", label: "Année", type: "text" },
        { name: "pdf_url", label: "Lien PDF du certificat (optionnel)", type: "text", placeholder: "https://…" },
        { name: "order", label: "Ordre d'affichage", type: "number" },
      ]}
      columns={[
        { header: "Année", render: (c) => <span className="font-heading font-bold text-[#0E7A3A]">{c.year}</span> },
        { header: "Intitulé", render: (c) => <span className="font-medium line-clamp-1">{c.title}</span> },
        { header: "Émetteur", render: (c) => <span className="text-sm text-muted-foreground">{c.issuer}</span> },
      ]}
    />
  );
}
