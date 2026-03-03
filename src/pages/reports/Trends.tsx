import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function ReportsTrends() {
  const [searchParams] = useSearchParams();
  const periodo = searchParams.get("periodo") ?? undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["reports-trends", periodo],
    queryFn: async () => {
      const params = periodo ? { periodo } : {};
      const res = await api.get<{ data: { month: string; monthLabel: string; income: number; expense: number }[] }>(
        "/reports/trends",
        { params }
      );
      return res.data;
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  const chartData = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Tendências</h2>
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Receitas x Despesas por mês</h3>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground">Nenhum dado no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <XAxis dataKey="monthLabel" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
              <Tooltip
                formatter={(value: number | undefined) => [value != null ? formatCurrency(value) : "", ""]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.monthLabel}
              />
              <Legend />
              <Bar dataKey="income" fill="hsl(var(--success))" name="Receitas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Despesas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
