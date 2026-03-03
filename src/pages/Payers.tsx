import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Payer {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export default function Payers() {
  const [isOpen, setIsOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Payer | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const queryClient = useQueryClient();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["payers"],
    queryFn: async () => {
      const res = await api.get<Payer[]>("/payers/");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) =>
      api.post("/payers/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payers"] });
      setIsOpen(false);
      setFormData({ name: "", description: "" });
      toast.success("Pagador criado!");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail || "Erro ao criar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/payers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payers"] });
      setToDelete(null);
      toast.success("Pagador removido");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail || "Erro ao remover");
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Pagadores</h2>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">Nenhum pagador cadastrado.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.description ?? "—"}</TableCell>
                  <TableCell>{p.is_active ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setToDelete(p)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo pagador</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Pessoa física"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover pagador</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Remover &quot;{toDelete?.name}&quot;?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
              disabled={deleteMutation.isPending}
            >
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
