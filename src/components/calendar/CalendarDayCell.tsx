import { Button } from "@/components/ui/button"
import { formatCurrency, cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import type { CalendarDay } from "./calendarUtils"

interface CalendarDayCellProps {
  day: CalendarDay
  onAdd: (date: string) => void
}

export function CalendarDayCell({ day, onAdd }: CalendarDayCellProps) {
  const totalDay = day.totalIncome - day.totalExpense
  const hasTransactions = day.transactions.length > 0

  return (
    <div
      className={cn(
        "flex h-full min-h-[140px] flex-col gap-1.5 rounded-lg border border-transparent bg-card/80 p-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/50",
        !day.isCurrentMonth && "opacity-60",
        day.isToday && "border-primary/70 bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "text-sm font-semibold leading-none",
            day.isToday
              ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
              : "text-foreground/90"
          )}
        >
          {day.label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 rounded-full"
          onClick={(e) => {
            e.stopPropagation()
            onAdd(day.date)
          }}
          aria-label={`Adicionar lançamento em ${day.date}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        {day.transactions.slice(0, 3).map((t) => (
          <div
            key={t.id}
            className="flex w-full items-center justify-between gap-1 rounded px-1.5 py-0.5 text-xs bg-muted/60"
          >
            <span className="truncate min-w-0">{t.description}</span>
            <span
              className={cn(
                "shrink-0 font-medium",
                t.transaction_type === "INCOME" ? "text-green-600" : "text-red-600"
              )}
            >
              {t.transaction_type === "INCOME" ? "+" : "-"}
              {formatCurrency(Math.abs(t.amount))}
            </span>
          </div>
        ))}
        {day.transactions.length > 3 && (
          <span className="text-xs text-muted-foreground">+{day.transactions.length - 3} mais</span>
        )}
      </div>

      {hasTransactions && (
        <div
          className={cn(
            "text-xs font-semibold border-t pt-1 mt-auto",
            totalDay >= 0 ? "text-green-600" : "text-red-600"
          )}
        >
          Total: {totalDay >= 0 ? "+" : ""}{formatCurrency(totalDay)}
        </div>
      )}
    </div>
  )
}
