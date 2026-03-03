import { useState, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { MonthNavigation } from "@/components/dashboard/MonthNavigation"
import { buildCalendarDays, WEEK_DAYS_SHORT } from "@/components/calendar/calendarUtils"
import { CalendarDayCell } from "@/components/calendar/CalendarDayCell"
import { TransactionFormDialog } from "@/components/transactions/TransactionFormDialog"
import { cn } from "@/lib/utils"

function parsePeriod(value: string | null): { year: number; month: number } {
  const now = new Date()
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }
  const [y, m] = value.split("-").map(Number)
  return { year: y, month: m }
}

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  return { start, end }
}

export default function Calendar() {
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const periodStr = searchParams.get("periodo")
  const { year, month } = parsePeriod(periodStr)
  const monthIndex = month - 1

  const { start, end } = useMemo(() => getMonthRange(year, month), [year, month])

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", "calendar", start, end],
    queryFn: async () => {
      const res = await api.get(`/transactions/?start_date=${start}T00:00:00Z&end_date=${end}T23:59:59Z&limit=500`)
      return Array.isArray(res.data) ? res.data : []
    },
  })

  const transactionsByDate = useMemo(() => {
    const map = new Map<string, { id: number; description: string; amount: number; transaction_type: string }[]>()
    transactions.forEach((t: { id: number; transaction_date: string; description: string; amount: number; transaction_type: string }) => {
      const key = t.transaction_date.slice(0, 10)
      const list = map.get(key) ?? []
      list.push({ id: t.id, description: t.description, amount: t.amount, transaction_type: t.transaction_type })
      map.set(key, list)
    })
    return map
  }, [transactions])

  const days = useMemo(
    () => buildCalendarDays(year, monthIndex, transactionsByDate),
    [year, monthIndex, transactionsByDate]
  )

  const handleAddForDate = (date: string) => {
    setSelectedDate(date)
    setCreateOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Calendário</h2>
      <MonthNavigation basePath="/calendar" />

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b bg-muted/30">
          {WEEK_DAYS_SHORT.map((dayName) => (
            <span key={dayName} className="px-2 py-3 text-center">
              {dayName}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border p-1">
          {days.map((day) => (
            <div
              key={day.date}
              className={cn("min-h-[140px]", !day.isCurrentMonth && "bg-muted/20")}
            >
              <CalendarDayCell day={day} onAdd={handleAddForDate} />
            </div>
          ))}
        </div>
      </div>

      <TransactionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDate={selectedDate ?? undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["transactions", "calendar"] })
        }}
      />
    </div>
  )
}
