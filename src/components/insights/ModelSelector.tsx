import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { AVAILABLE_MODELS } from "@/lib/insights";

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const openaiModels = AVAILABLE_MODELS.filter((m) => m.provider === "openai");
const claudeModels = AVAILABLE_MODELS.filter((m) => m.provider === "anthropic");

export function ModelSelector({ value, onValueChange, disabled }: ModelSelectorProps) {
  return (
    <Card className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[1fr,auto] lg:gap-6 lg:items-start">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Definir modelo de análise</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Escolha o provedor de IA (OpenAI ou Anthropic Claude) e o modelo que será utilizado para gerar insights sobre seus dados financeiros do mês selecionado.
        </p>
      </div>
      <div className="flex flex-col gap-2 min-w-[220px]">
        <Label>Modelo</Label>
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>OpenAI</SelectLabel>
              {openaiModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Anthropic Claude</SelectLabel>
              {claudeModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
