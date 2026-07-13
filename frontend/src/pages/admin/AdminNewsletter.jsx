import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/components/ArticleCard";
import api from "@/lib/api";

export default function AdminNewsletter() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => (await api.get("/admin/newsletter")).data,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Abonnés newsletter</h1>
          <p className="text-sm text-muted-foreground mt-1">Liste des adresses inscrites à la newsletter.</p>
        </div>
        <span className="rounded-full bg-[#0E7A3A]/10 text-[#0E7A3A] px-4 py-1.5 text-sm font-semibold">
          {data.length} abonné(s)
        </span>
      </div>

      <Card className="mt-6 border-border">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#0E7A3A]" /></div>
        ) : data.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground text-sm">Aucun abonné pour le moment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adresse e-mail</TableHead>
                <TableHead className="text-right">Date d'inscription</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.id} data-testid={`newsletter-row-${s.id}`}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#7FAE3C]" /> {s.email}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
