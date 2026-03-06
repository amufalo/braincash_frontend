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
  // OpenAI (modelos atuais - mar 2026)
  { id: "gpt-5.4", name: "GPT-5.4", provider: "openai" as const },
  { id: "gpt-5.4-pro", name: "GPT-5.4 Pro", provider: "openai" as const },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai" as const },
  { id: "gpt-5-nano", name: "GPT-5 Nano", provider: "openai" as const },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai" as const },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" as const },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" as const },
  // Anthropic Claude (modelos atuais - mar 2026)
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "anthropic" as const },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic" as const },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "anthropic" as const },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "anthropic" as const },
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", provider: "anthropic" as const },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic" as const },
] as const;

export type InsightModelId = (typeof AVAILABLE_MODELS)[number]["id"];
export type InsightProvider = (typeof AVAILABLE_MODELS)[number]["provider"];

export const DEFAULT_MODEL = "gpt-4o-mini";
