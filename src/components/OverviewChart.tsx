import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface OverviewChartProps {
    data: any[]
}

export function OverviewChart({ data }: OverviewChartProps) {
    return (
        <div className="w-full h-[240px] sm:h-[300px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                    formatter={(value: any) => [`R$ ${value}`, 'Valores']}
                    labelStyle={{ color: 'black' }}
                />
                <Bar dataKey="income" fill="#28D8A4" radius={[4, 4, 0, 0]} name="Receitas" />
                <Bar dataKey="expense" fill="#FF5A5F" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
        </ResponsiveContainer>
        </div>
    )
}
