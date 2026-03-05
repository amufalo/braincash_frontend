"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { PAYMENT_METHODS, CONDITIONS, type PaymentMethodId, type ConditionId } from "@/lib/transaction-form"

const defaultFormState = {
  description: "",
  amount: "0",
  transaction_type: "EXPENSE" as "EXPENSE" | "INCOME",
  transaction_date: new Date().toISOString().split("T")[0],
  category_id: "",
  account_id: "",
  card_id: "",
  payment_method: "" as PaymentMethodId | "",
  condition: "a_vista" as ConditionId,
  installments: "1",
  recurrence_months: "1",
  is_paid: true,
  notes: "",
}

export interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Data pré-preenchida (YYYY-MM-DD) para novo lançamento */
  defaultDate?: string
  defaultType?: "EXPENSE" | "INCOME"
  /** Chamado após criar/atualizar com sucesso */
  onSuccess?: () => void
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultType = "EXPENSE",
  onSuccess,
}: TransactionFormDialogProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(defaultFormState)

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories/")
      return res.data
    },
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.get("/accounts/")
      return res.data
    },
  })

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const res = await api.get("/cards/")
      return res.data
    },
  })

  useEffect(() => {
    if (open) {
      const date = defaultDate?.slice(0, 10) ?? new Date().toISOString().split("T")[0]
      setFormData({
        ...defaultFormState,
        transaction_date: date,
        transaction_type: defaultType,
      })
    }
  }, [open, defaultDate, defaultType])

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => api.post("/transactions/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["cards"] })
      onOpenChange(false)
      toast.success("Transação criada!")
      onSuccess?.()
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail ?? "Erro ao criar transação")
    },
  })

  const createRecurringMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      api.post("/transactions/recurring", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["cards"] })
      onOpenChange(false)
      const n = Number(variables.recurrence_months) || 0
      toast.success(`${n} lançamentos recorrentes criados!`)
      onSuccess?.()
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail ?? "Erro ao criar lançamentos recorrentes")
    },
  })

  const paymentMethod = formData.payment_method
    ? PAYMENT_METHODS.find((p) => p.id === formData.payment_method)
    : null
  const destination = paymentMethod?.destination ?? "account"
  const conditionConfig = CONDITIONS.find((c) => c.id === formData.condition) ?? CONDITIONS[0]
  const filteredCategories = categories.filter((c: { type: string }) => c.type === formData.transaction_type)

  const applyPaymentMethodDefaults = (methodId: PaymentMethodId) => {
    const method = PAYMENT_METHODS.find((m) => m.id === methodId)
    if (!method) return
    setFormData((prev) => ({
      ...prev,
      payment_method: methodId,
      account_id: method.destination === "account" ? prev.account_id : "",
      card_id: method.destination === "card" ? prev.card_id : "",
      is_paid: method.isPaidByDefault,
    }))
  }

  const buildPayload = (overrides: { transaction_date?: string; installments?: number } = {}) => {
    const date = overrides.transaction_date ?? formData.transaction_date
    const installments = overrides.installments ?? (Number(formData.installments) || 1)
    const payload: Record<string, unknown> = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      transaction_type: formData.transaction_type,
      transaction_date: date.includes("T") ? date : `${date}T12:00:00Z`,
      category_id: parseInt(formData.category_id, 10),
      installments: Math.max(1, installments),
      is_paid: formData.is_paid,
      notes: formData.notes?.trim() || null,
    }
    if (formData.account_id) payload.account_id = parseInt(formData.account_id, 10)
    if (formData.card_id) payload.card_id = parseInt(formData.card_id, 10)
    return payload
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.condition === "recorrente") {
      const months = Math.max(1, Math.min(120, parseInt(formData.recurrence_months, 10) || 1))
      const payload = buildPayload()
      delete (payload as Record<string, unknown>).installments
      createRecurringMutation.mutate({ ...payload, recurrence_months: months })
      return
    }
    createMutation.mutate(buildPayload())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.transaction_type === "INCOME" ? "Nova receita" : "Nova despesa"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(val) =>
                setFormData({ ...formData, transaction_type: val as "EXPENSE" | "INCOME", category_id: "" })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Despesa</SelectItem>
                <SelectItem value="INCOME">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select
              value={formData.category_id}
              onValueChange={(val) => setFormData({ ...formData, category_id: val })}
              required
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c: { id: number; name: string }) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={formData.payment_method || undefined}
                onValueChange={(val) => applyPaymentMethodDefaults(val as PaymentMethodId)}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a forma de pagamento" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.label}
                      {pm.isPaidByDefault && " (já pago)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {paymentMethod && (
              <div className="grid gap-2">
                <Label>{destination === "account" ? "Conta" : "Cartão"}</Label>
                {destination === "account" ? (
                  <Select
                    value={formData.account_id || undefined}
                    onValueChange={(val) => setFormData({ ...formData, account_id: val })}
                    required
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                    <SelectContent>
                      {accounts?.map((a: { id: number; name: string }) => (
                        <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={formData.card_id || undefined}
                    onValueChange={(val) => setFormData({ ...formData, card_id: val })}
                    required
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione o cartão" /></SelectTrigger>
                    <SelectContent>
                      {cards?.map((c: { id: number; name: string }) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
          <div className="rounded-lg border p-4 space-y-4">
            <Label className="text-sm font-medium">Condição</Label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  variant={formData.condition === c.id ? "secondary" : "outline"}
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      condition: c.id,
                      installments: c.installmentsDefault.toString(),
                    })
                  }
                >
                  {c.label}
                </Button>
              ))}
            </div>
            {conditionConfig.showInstallmentsInput && (
              <div className="grid gap-2 max-w-[140px]">
                <Label className="text-xs">Número de parcelas</Label>
                <Input
                  type="number"
                  min="2"
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                />
              </div>
            )}
            {conditionConfig.showRecurrenceInput && (
              <div className="grid gap-2 max-w-[180px]">
                <Label className="text-xs">Repetir por (meses)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.recurrence_months}
                  onChange={(e) => setFormData({ ...formData, recurrence_months: e.target.value })}
                />
              </div>
            )}
          </div>
          {paymentMethod && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cal_is_paid"
                checked={formData.is_paid}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_paid: checked === true })
                }
              />
              <Label htmlFor="cal_is_paid" className="text-sm font-normal cursor-pointer">
                Lançamento já pago
              </Label>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Observação</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <Button
            type="submit"
            disabled={createMutation.isPending || createRecurringMutation.isPending}
          >
            {formData.condition === "recorrente" ? "Criar lançamentos recorrentes" : "Criar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
