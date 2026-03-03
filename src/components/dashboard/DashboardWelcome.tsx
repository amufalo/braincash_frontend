import { Card } from "@/components/ui/card";

interface DashboardWelcomeProps {
  name?: string | null;
}

const formatCurrentDate = (date = new Date()) => {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
};

const capitalizeFirst = (s: string) =>
  s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
};

export function DashboardWelcome({ name }: DashboardWelcomeProps) {
  const displayName = name?.trim() ? name : "Administrador";
  const greeting = getGreeting();
  const dateStr = capitalizeFirst(formatCurrentDate());

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/10 to-primary/5 px-6 py-8 shadow-sm">
      <div className="relative">
        <h1 className="text-xl font-medium tracking-tight">
          {greeting}, {displayName}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
      </div>
    </Card>
  );
}
