import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ReportsCards() {
  const [searchParams] = useSearchParams();
  const periodo = searchParams.get("periodo") ?? undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["reports-cards", periodo],
    queryFn: async () => {
      const params = periodo ? { periodo } : {};
      const res = await api.get<{ data: { cardId: number; cardName: string; total: number }[] }>(
        "/reports/cards",
        { params }
      );
      return res.data;
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  const rows = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Uso de Cartões</h2>
      <Card className="p-6">
        {rows.length === 0 ? (
          <p className="text-muted-foreground">Nenhum gasto em cartão no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cartão</TableHead>
                <TableHead className="text-right">Total (período)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.cardId}>
                  <TableCell>{r.cardName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
