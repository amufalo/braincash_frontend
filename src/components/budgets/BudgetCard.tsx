import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, cn } from "@/lib/utils"
import { Pencil, Trash2 } from "lucide-react"

export interface BudgetWithSpent {
  id: number
  category_id: number | null
  period: string
  amount_limit: string | number
  spent: number
  category?: { id: number; name: string; color?: string | null } | null
}

interface BudgetCardProps {
  budget: BudgetWithSpent
  periodLabel: string
  onEdit?: (budget: BudgetWithSpent) => void
  onRemove?: (budget: BudgetWithSpent) => void
}

function usagePercent(spent: number, limit: number): number {
  if (limit <= 0) return spent > 0 ? 100 : 0
  return Math.min(100, Math.max(0, (spent / limit) * 100))
}

export function BudgetCard({
  budget,
  periodLabel,
  onEdit,
  onRemove,
}: BudgetCardProps) {
  const limit = Number(budget.amount_limit)
  const spent = Number(budget.spent)
  const exceeded = limit >= 0 && spent > limit
  const difference = Math.abs(spent - limit)
  const percent = usagePercent(spent, limit)
  const categoryName = budget.category?.name ?? "Global"

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-col gap-4 flex-1">
        <div className="flex items-start gap-3">
          {budget.category?.color && (
            <div
              className="h-10 w-10 rounded-full shrink-0 border-2 border-background"
              style={{ backgroundColor: budget.category.color }}
              aria-hidden
            />
          )}
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold leading-tight truncate">
              {categoryName}
            </h3>
            <p className="text-xs text-muted-foreground">
              Orçamento de {periodLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Gasto até agora</span>
            <span className={cn("font-medium", exceeded && "text-destructive")}>
              {formatCurrency(spent)}
            </span>
          </div>
          <Progress
            value={percent}
            className={cn("h-2", exceeded && "bg-destructive/20 [&>div]:bg-destructive")}
          />
          <div className="flex items-baseline justify-between gap-1 text-sm">
            <span className="text-muted-foreground">Limite</span>
            <span className="font-medium">{formatCurrency(limit)}</span>
          </div>

          <div>
            {exceeded ? (
              <p className="text-xs text-destructive">
                Excedeu em {formatCurrency(difference)}
              </p>
            ) : (
              <p className="text-xs text-green-600 dark:text-green-500">
                Restam {formatCurrency(Math.max(0, limit - spent))} disponíveis.
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3 text-sm">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(budget)}
            className="flex items-center gap-1 text-primary font-medium hover:opacity-80"
          >
            <Pencil className="h-4 w-4" /> editar
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(budget)}
            className="flex items-center gap-1 text-destructive font-medium hover:opacity-80"
          >
            <Trash2 className="h-4 w-4" /> remover
          </button>
        )}
      </CardFooter>
    </Card>
  )
}
