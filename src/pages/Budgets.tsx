import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, Copy } from "lucide-react"
import { toast } from "sonner"
import { MonthNavigation } from "@/components/budgets/MonthNavigation"
import { BudgetCard, type BudgetWithSpent } from "@/components/budgets/BudgetCard"
import { useMonthPeriod } from "@/hooks/useMonthPeriod"

const GLOBAL_CATEGORY_VALUE = "__global__"

export default function Budgets() {
  const { period, periodLabel } = useMonthPeriod()
  const [isOpen, setIsOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null)
  const [toDelete, setToDelete] = useState<BudgetWithSpent | null>(null)
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false)
  const [formData, setFormData] = useState({
    period,
    category_id: GLOBAL_CATEGORY_VALUE,
    amount_limit: "0",
  })

  const queryClient = useQueryClient()

  const { data: list = [], isLoading, isError, error } = useQuery({
    queryKey: ["budgets", period],
    queryFn: async () => {
      const res = await api.get<BudgetWithSpent[]>(`/budgets/?period=${period}`)
      const data = res.data
      return Array.isArray(data) ? data : []
    },
  })

  const { data: categoriesRaw = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories/")
      return Array.isArray(res.data) ? res.data : []
    },
  })

  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : []
  const expenseCategories = categories.filter((c: { type: string }) => c.type === "EXPENSE")

  const createMutation = useMutation({
    mutationFn: async (data: { period: string; category_id: string; amount_limit: string }) =>
      api.post("/budgets/", {
        period: data.period,
        category_id: data.category_id === GLOBAL_CATEGORY_VALUE ? null : Number(data.category_id),
        amount_limit: Number(data.amount_limit),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      setIsOpen(false)
      setFormData((p) => ({ ...p, period, category_id: GLOBAL_CATEGORY_VALUE, amount_limit: "0" }))
      toast.success("Orçamento criado!")
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail || "Erro ao criar")
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, amount_limit }: { id: number; amount_limit: number }) =>
      api.put(`/budgets/${id}`, { amount_limit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      setIsOpen(false)
      setEditingBudget(null)
      toast.success("Orçamento atualizado!")
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail || "Erro ao atualizar")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      setToDelete(null)
      toast.success("Orçamento removido")
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail || "Erro ao remover")
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async (periodToUse: string) =>
      api.post("/budgets/duplicate-previous-month", { period: periodToUse }),
    onSuccess: (_, periodToUse) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      setCopyConfirmOpen(false)
      toast.success("Orçamentos do último mês copiados!")
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail || "Erro ao copiar")
    },
  })

  const openCreate = useCallback(() => {
    setEditingBudget(null)
    setFormData({
      period,
      category_id: GLOBAL_CATEGORY_VALUE,
      amount_limit: "0",
    })
    setIsOpen(true)
  }, [period])

  const openEdit = useCallback((budget: BudgetWithSpent) => {
    setEditingBudget(budget)
    setFormData({
      period: budget.period,
      category_id: budget.category_id != null ? String(budget.category_id) : GLOBAL_CATEGORY_VALUE,
      amount_limit: String(budget.amount_limit),
    })
    setIsOpen(true)
  }, [])

  const handleSubmit = () => {
    if (Number(formData.amount_limit) <= 0) {
      toast.error("Limite deve ser maior que zero")
      return
    }
    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, amount_limit: Number(formData.amount_limit) })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleCopyConfirm = () => {
    duplicateMutation.mutate(period)
  }

  const isFormOpen = isOpen
  const isCreate = editingBudget == null

  return (
    <div className="flex flex-col gap-6">
      <MonthNavigation />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Orçamentos</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={openCreate}
            disabled={expenseCategories.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo orçamento
          </Button>
          <Button
            variant="outline"
            onClick={() => setCopyConfirmOpen(true)}
            disabled={expenseCategories.length === 0}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar orçamentos do último mês
          </Button>
        </div>
      </div>

      {isError ? (
        <p className="text-destructive">
          Erro ao carregar orçamentos. {error instanceof Error ? error.message : "Tente novamente."}
        </p>
      ) : isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : list.length === 0 ? (
        <Card className="flex min-h-[200px] w-full items-center justify-center py-12">
          <p className="text-muted-foreground text-center px-4">
            Nenhum orçamento cadastrado para {periodLabel}.
            <br />
            Crie um orçamento ou copie os do mês anterior.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <BudgetCard
              key={b.id}
              budget={{
                ...b,
                amount_limit: b.amount_limit ?? 0,
                spent: Number(typeof (b as { spent?: unknown }).spent === "number"
                  ? (b as { spent: number }).spent
                  : (b as { spent?: string }).spent ?? 0),
              }}
              periodLabel={periodLabel}
              onEdit={openEdit}
              onRemove={setToDelete}
            />
          ))}
        </div>
      )}

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsOpen(false)
            setEditingBudget(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreate ? "Novo orçamento" : "Editar orçamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Período (YYYY-MM)</Label>
              <Input
                type="month"
                value={formData.period}
                onChange={(e) => setFormData((p) => ({ ...p, period: e.target.value }))}
                disabled={!isCreate}
              />
            </div>
            <div>
              <Label>Categoria (vazio = global)</Label>
              <Select
                value={formData.category_id}
                onValueChange={(v) => setFormData((p) => ({ ...p, category_id: v }))}
                disabled={!isCreate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GLOBAL_CATEGORY_VALUE}>Global</SelectItem>
                  {expenseCategories.map((c: { id: number; name: string }) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Limite (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount_limit}
                onChange={(e) => setFormData((p) => ({ ...p, amount_limit: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isCreate ? "Salvar" : "Atualizar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover orçamento</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Remover orçamento de {toDelete?.period} ({toDelete?.category?.name ?? "Global"})?
            Esta ação remove o limite configurado para a categoria.
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

      <Dialog open={copyConfirmOpen} onOpenChange={setCopyConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar orçamentos do último mês?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Isso copiará os limites definidos no mês anterior para as categorias que ainda não
            possuem orçamento em {periodLabel}.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCopyConfirmOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCopyConfirm}
              disabled={duplicateMutation.isPending}
            >
              {duplicateMutation.isPending ? "Copiando..." : "Copiar orçamentos"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
