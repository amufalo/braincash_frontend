import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMonthPeriod } from "@/hooks/useMonthPeriod"
import { cn } from "@/lib/utils"

export function MonthNavigation() {
  const {
    periodLabel,
    prevPeriod,
    nextPeriod,
    setPeriod,
    isCurrentMonth,
    defaultPeriod,
  } = useMonthPeriod()

  return (
    <Card className="w-full flex flex-row items-center gap-2 p-4">
      <button
        type="button"
        onClick={() => setPeriod(prevPeriod)}
        className="rounded-lg p-1 text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div
        className={cn(
          "flex items-center gap-1 min-w-[140px] justify-center font-semibold capitalize"
        )}
        aria-label={`Período: ${periodLabel}`}
      >
        {periodLabel}
      </div>
      <button
        type="button"
        onClick={() => setPeriod(nextPeriod)}
        className="rounded-lg p-1 text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      {!isCurrentMonth && (
        <Button
          variant="outline"
          size="sm"
          className="ml-2 h-8 text-xs"
          onClick={() => setPeriod(defaultPeriod)}
        >
          Voltar ao mês atual
        </Button>
      )}
    </Card>
  )
}
