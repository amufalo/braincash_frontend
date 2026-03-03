import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type TabId = "preferencias" | "nome" | "senha" | "email" | "changelog" | "deletar";

const TABS: { id: TabId; label: string; destructive?: boolean }[] = [
  { id: "preferencias", label: "Preferências" },
  { id: "nome", label: "Alterar nome" },
  { id: "senha", label: "Alterar senha" },
  { id: "email", label: "Alterar e-mail" },
  { id: "changelog", label: "Changelog" },
  { id: "deletar", label: "Deletar conta", destructive: true },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>("preferencias");
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Ajustes</h2>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              activeTab === tab.id && "bg-accent",
              tab.destructive && activeTab === tab.id && "text-destructive"
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "preferencias" && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-1">Preferências</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Personalize sua experiência no Brain Cash.
          </p>
          <p className="text-sm text-muted-foreground">Em breve...</p>
        </Card>
      )}

      {activeTab === "nome" && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-1">Alterar nome</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Atualize como seu nome aparece no app.
          </p>
          <div className="grid gap-4 max-w-sm">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" defaultValue={user?.name ?? ""} className="mt-1" />
            </div>
            <Button>Salvar</Button>
          </div>
        </Card>
      )}

      {activeTab === "senha" && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-1">Alterar senha</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Defina uma nova senha para sua conta.
          </p>
          <div className="grid gap-4 max-w-sm">
            <div>
              <Label htmlFor="current-password">Senha atual</Label>
              <Input id="current-password" type="password" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" className="mt-1" />
            </div>
            <Button>Alterar senha</Button>
          </div>
        </Card>
      )}

      {activeTab === "email" && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-1">Alterar e-mail</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Atualize o e-mail associado à sua conta.
          </p>
          <div className="grid gap-4 max-w-sm">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" defaultValue={user?.email ?? ""} className="mt-1" />
            </div>
            <Button>Salvar</Button>
          </div>
        </Card>
      )}

      {activeTab === "changelog" && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-1">Changelog</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Histórico de alterações do Brain Cash.
          </p>
          <p className="text-sm text-muted-foreground">Em breve...</p>
        </Card>
      )}

      {activeTab === "deletar" && (
        <Card className="p-6 border-destructive/50">
          <h3 className="text-lg font-bold mb-1 text-destructive">Deletar conta</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Esta ação é irreversível. Todos os dados serão removidos.
          </p>
          <Button variant="destructive">Deletar minha conta</Button>
        </Card>
      )}
    </div>
  );
}
