/**
 * Tipos e constantes para a página de Insights (análise com IA).
 */

export const INSIGHT_CATEGORIES = {
  behaviors: {
    id: "behaviors" as const,
    title: "Comportamentos Observados",
    color: "orange",
  },
  triggers: {
    id: "triggers" as const,
    title: "Gatilhos de Consumo",
    color: "amber",
  },
  recommendations: {
    id: "recommendations" as const,
    title: "Recomendações Práticas",
    color: "sky",
  },
  improvements: {
    id: "improvements" as const,
    title: "Melhorias Sugeridas",
    color: "emerald",
  },
} as const;

export type InsightCategoryId = keyof typeof INSIGHT_CATEGORIES;

export interface InsightItem {
  text: string;
}

export interface InsightCategoryData {
  category: InsightCategoryId;
  items: InsightItem[];
}

export interface InsightsResponse {
  month: string;
  generatedAt: string;
  categories: InsightCategoryData[];
}

/** Modelos disponíveis para análise (OpenAI e Anthropic Claude). */
export const AVAILABLE_MODELS = [
  // OpenAI
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" as const },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" as const },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai" as const },
  // Anthropic Claude
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic" as const },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic" as const },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic" as const },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic" as const },
] as const;

export type InsightModelId = (typeof AVAILABLE_MODELS)[number]["id"];
export type InsightProvider = (typeof AVAILABLE_MODELS)[number]["provider"];

export const DEFAULT_MODEL = "gpt-4o-mini";
