import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import api from "@/lib/axios"
import { StatsCard } from "@/components/StatsCard"
import { OverviewChart } from "@/components/OverviewChart"
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome"
import { MonthNavigation } from "@/components/dashboard/MonthNavigation"
import { useAuth } from "@/contexts/AuthContext"
import { Wallet, CreditCard, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

export default function Dashboard() {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const periodo = searchParams.get("periodo") ?? undefined

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats', periodo],
        queryFn: async () => {
            const params = periodo ? { periodo } : {}
            const res = await api.get('/dashboard/stats', { params });
            return res.data;
        }
    });

    if (isLoading) {
        return <div className="p-8">Carregando dashboard...</div>
    }

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <DashboardWelcome name={user?.name} />
            <MonthNavigation />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Saldo em Contas"
                    value={formatCurrency(stats?.totalBalance || 0)}
                    icon={Wallet}
                    description="Total disponível"
                />
                <StatsCard
                    title="Faturas Atuais"
                    value={formatCurrency(stats?.totalInvoice || 0)}
                    icon={CreditCard}
                    description="Total em cartões"
                // Usually credit card debt is negative for net worth, but here we show positive invoice amount
                />
                <StatsCard
                    title="Receita Mês"
                    value={formatCurrency(stats?.monthlyIncome || 0)}
                    icon={TrendingUp}
                    description="Entradas este mês"
                    trendUp={true}
                    trend="+20.1% vs mês passado" // Mock trend for now
                />
                <StatsCard
                    title="Despesa Mês"
                    value={formatCurrency(stats?.monthlyExpense || 0)}
                    icon={TrendingDown}
                    description="Saídas este mês"
                    trendUp={false}
                    trend="+10.5% vs mês passado" // Mock trend
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                <div className="lg:col-span-4 rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="font-semibold leading-none tracking-tight">Visão Geral</h3>
                    </div>
                    <div className="p-6 pt-0 pl-2">
                        <OverviewChart data={stats?.chartData || []} />
                    </div>
                </div>
                <div className="lg:col-span-3 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="font-semibold leading-none tracking-tight">Transações Recentes</h3>
                    </div>
                    <div className="p-6 pt-0">
                        {!stats?.recentTransactions || stats.recentTransactions.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Nenhuma transação encontrada.
                            </p>
                        ) : (
                            <ul className="space-y-3 text-sm">
                                {stats.recentTransactions.map((t: any) => {
                                    const isIncome = t.transactionType === "INCOME"
                                    const isExpense = t.transactionType === "EXPENSE"
                                    const amountClass = isIncome
                                        ? "text-green-600"
                                        : isExpense
                                        ? "text-red-600"
                                        : "text-muted-foreground"

                                    const origin =
                                        t.accountName ||
                                        t.cardName ||
                                        t.categoryName ||
                                        null

                                    return (
                                        <li key={t.id} className="flex items-start justify-between gap-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium line-clamp-1">
                                                    {t.description}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {t.transactionDate
                                                        ? formatDate(t.transactionDate)
                                                        : "-"}
                                                    {origin && ` · ${origin}`}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn("text-sm font-semibold", amountClass)}>
                                                    {formatCurrency(t.amount || 0)}
                                                </span>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
