import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import api from "@/lib/axios";
import { MonthNavigation } from "@/components/dashboard/MonthNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InsightsGrid } from "@/components/insights/InsightsGrid";
import { ModelSelector } from "@/components/insights/ModelSelector";
import type { InsightsResponse } from "@/lib/insights";
import { DEFAULT_MODEL } from "@/lib/insights";
import { AlertCircle, Sparkles, Save, Trash2 } from "lucide-react";

const PERIOD_PARAM = "periodo";

function parsePeriod(value: string | null): string {
  const now = new Date();
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }
  return value;
}

export default function Insights() {
  const [searchParams] = useSearchParams();
  const period = parsePeriod(searchParams.get(PERIOD_PARAM));
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedDate, setSavedDate] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: savedData, isLoading } = useQuery({
    queryKey: ["insights-saved", period],
    queryFn: async () => {
      const res = await api.get("/insights/saved", { params: { period } });
      return res.data;
    },
  });

  useEffect(() => {
    if (savedData?.data) {
      setInsights(savedData.data as InsightsResponse);
      setSelectedModel(savedData.modelId || DEFAULT_MODEL);
      setIsSaved(true);
      setSavedDate(savedData.createdAt ?? null);
    } else if (savedData && !savedData.data) {
      setInsights(null);
      setIsSaved(false);
      setSavedDate(null);
    }
  }, [savedData]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/insights/generate", { period, model_id: selectedModel });
      return res.data as InsightsResponse;
    },
    onSuccess: (data) => {
      setInsights(data);
      setError(null);
      setIsSaved(false);
      setSavedDate(null);
      toast.success("Insights gerados com sucesso!");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "Erro ao gerar insights.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      toast.error(msg);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!insights) throw new Error("Nenhum insight para salvar");
      await api.post("/insights/saved", {
        period,
        model_id: selectedModel,
        data: insights,
      });
    },
    onSuccess: () => {
      setIsSaved(true);
      setSavedDate(new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: ["insights-saved", period] });
      toast.success("Análise salva com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Erro ao salvar.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/insights/saved", { params: { period } });
    },
    onSuccess: () => {
      setIsSaved(false);
      setSavedDate(null);
      setInsights(null);
      queryClient.invalidateQueries({ queryKey: ["insights-saved", period] });
      toast.success("Análise removida com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Erro ao remover.");
    },
  });

  const handleAnalyze = () => {
    setError(null);
    generateMutation.mutate();
  };

  const handleSave = () => {
    if (insights) saveMutation.mutate();
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const isPending = generateMutation.isPending;
  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Insights</h2>

      <MonthNavigation basePath="/insights" />

      <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex gap-3">
        <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <p className="text-sm text-card-foreground">
          <strong>Aviso de privacidade:</strong> Ao gerar insights, seus dados financeiros serão enviados para o provedor de IA escolhido (OpenAI ou Anthropic Claude) para processamento. Certifique-se de que você confia no provedor antes de prosseguir.
        </p>
      </div>

      <ModelSelector
        value={selectedModel}
        onValueChange={setSelectedModel}
        disabled={isPending}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleAnalyze}
          disabled={isPending || isLoading}
          className="bg-gradient-to-r from-primary to-violet-500 dark:from-primary dark:to-emerald-600"
        >
          <Sparkles className="mr-2 size-5" aria-hidden />
          {isPending ? "Analisando..." : "Gerar análise inteligente"}
        </Button>

        {insights && !error && (
          <Button
            onClick={isSaved ? handleDelete : handleSave}
            disabled={isSaving || isPending || isLoading}
            variant={isSaved ? "destructive" : "outline"}
          >
            {isSaved ? (
              <>
                <Trash2 className="mr-2 size-4" />
                {deleteMutation.isPending ? "Removendo..." : "Remover análise"}
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                {saveMutation.isPending ? "Salvando..." : "Salvar análise"}
              </>
            )}
          </Button>
        )}

        {isSaved && savedDate && (
          <span className="text-sm text-muted-foreground">
            Salva em {format(new Date(savedDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        )}
      </div>

      <div className="min-h-[400px]">
        {(isPending || isLoading) && <LoadingState />}
        {!isPending && !isLoading && !insights && !error && (
          <Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
            <CardContent className="flex flex-col items-center gap-2 text-center">
              <Sparkles className="size-12 text-primary" />
              <h3 className="font-semibold">Nenhuma análise realizada</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Clique no botão acima para gerar insights inteligentes sobre seus dados financeiros do mês selecionado.
              </p>
            </CardContent>
          </Card>
        )}
        {!isPending && !isLoading && error && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-4 text-center">
            <h3 className="text-lg font-semibold text-destructive">Erro ao gerar insights</h3>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            <Button onClick={handleAnalyze} variant="outline">
              Tentar novamente
            </Button>
          </div>
        )}
        {!isPending && !isLoading && insights && !error && (
          <InsightsGrid insights={insights} />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 px-1">
        <div className="h-5 w-full max-w-2xl rounded bg-muted animate-pulse" />
        <div className="h-5 w-full max-w-md rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-5 rounded bg-muted animate-pulse" />
                <div className="h-5 w-32 rounded bg-muted animate-pulse" />
              </div>
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex gap-2 py-2.5 border-b border-dashed last:border-0">
                  <div className="size-4 shrink-0 rounded bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
