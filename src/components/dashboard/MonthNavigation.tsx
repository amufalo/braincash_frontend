import { useSearchParams, Link, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const PERIOD_PARAM = "periodo";

function parsePeriod(value: string | null): { month: number; year: number } {
  const now = new Date();
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return { month: now.getMonth(), year: now.getFullYear() };
  }
  const [y, m] = value.split("-").map(Number);
  return { month: m - 1, year: y };
}

function buildSearch(month: number, year: number): string {
  const m = String(month + 1).padStart(2, "0");
  return `${PERIOD_PARAM}=${year}-${m}`;
}

interface MonthNavigationProps {
  /** Base path for links (e.g. "/" or "/insights"). Defaults to current pathname. */
  basePath?: string;
}

export function MonthNavigation({ basePath }: MonthNavigationProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pathname = basePath ?? location.pathname;
  const periodStr = searchParams.get(PERIOD_PARAM);
  const { month, year } = parsePeriod(periodStr);

  const current = useMemo(() => new Date(year, month, 1), [year, month]);
  const now = useMemo(() => new Date(), []);
  const isCurrent = current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear();

  const prevDate = subMonths(current, 1);
  const nextDate = addMonths(current, 1);
  const prevSearch = buildSearch(prevDate.getMonth(), prevDate.getFullYear());
  const nextSearch = buildSearch(nextDate.getMonth(), nextDate.getFullYear());
  const currentSearch = buildSearch(now.getMonth(), now.getFullYear());

  const label = format(current, "MMMM yyyy", { locale: ptBR });
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-4 py-3">
      <div className="flex items-center gap-2 order-2 sm:order-1">
        <Button variant="outline" size="icon" asChild>
          <Link to={{ pathname, search: prevSearch }} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="icon" asChild>
          <Link to={{ pathname, search: nextSearch }} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        {!isCurrent && (
          <Button variant="ghost" size="sm" asChild>
            <Link to={{ pathname, search: currentSearch }}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Voltar ao mês atual
            </Link>
          </Button>
        )}
      </div>
      <span className="text-sm font-medium text-muted-foreground order-1 sm:order-2 text-center sm:text-left">{displayLabel}</span>
    </Card>
  );
}
