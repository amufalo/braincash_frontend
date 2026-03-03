import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Zap, Lightbulb, Rocket, Sparkles } from "lucide-react";
import type { InsightsResponse, InsightCategoryId } from "@/lib/insights";
import { INSIGHT_CATEGORIES } from "@/lib/insights";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<InsightCategoryId, React.ComponentType<{ className?: string }>> = {
  behaviors: Eye,
  triggers: Zap,
  recommendations: Lightbulb,
  improvements: Rocket,
};

const CATEGORY_STYLES: Record<InsightCategoryId, { title: string; icon: string }> = {
  behaviors: { title: "text-orange-700 dark:text-orange-400", icon: "text-orange-600 dark:text-orange-400" },
  triggers: { title: "text-amber-700 dark:text-amber-400", icon: "text-amber-600 dark:text-amber-400" },
  recommendations: { title: "text-sky-700 dark:text-sky-400", icon: "text-sky-600 dark:text-sky-400" },
  improvements: { title: "text-emerald-700 dark:text-emerald-400", icon: "text-emerald-600 dark:text-emerald-400" },
};

interface InsightsGridProps {
  insights: InsightsResponse;
}

export function InsightsGrid({ insights }: InsightsGridProps) {
  const [year, month] = insights.month.split("-");
  const periodDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  const formattedPeriod = format(periodDate, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6">
      <div className="space-y-2 px-1 text-muted-foreground">
        <p>
          No período selecionado ({formattedPeriod}), identificamos os principais comportamentos e gatilhos que impactaram seu padrão de consumo.
        </p>
        <p>Segue um panorama prático com recomendações acionáveis.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {insights.categories.map((categoryData) => {
          const config = INSIGHT_CATEGORIES[categoryData.category];
          const styles = CATEGORY_STYLES[categoryData.category];
          const Icon = CATEGORY_ICONS[categoryData.category];

          return (
            <Card key={categoryData.category} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className={cn("size-5", styles.icon)} />
                  <CardTitle className={cn("font-semibold", styles.title)}>
                    {config.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {categoryData.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-1 border-b border-dashed py-2.5 gap-2 items-start last:border-0"
                  >
                    <Sparkles className={cn("size-4 shrink-0 mt-0.5", styles.icon)} />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
