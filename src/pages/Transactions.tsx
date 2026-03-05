import { useState } from "react"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Search, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { PAYMENT_METHODS, CONDITIONS, type PaymentMethodId, type ConditionId } from "@/lib/transaction-form"
import { resolveLogoPath, resolveBrandAsset } from "@/lib/logo"

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

export default function Transactions() {
    const [isOpen, setIsOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [transactionToDelete, setTransactionToDelete] = useState<{ id: number; description?: string; group_id?: string } | null>(null)
    const [filters, setFilters] = useState({ start_date: "", end_date: "", type: "ALL" })
    const [formData, setFormData] = useState(defaultFormState)

    const queryClient = useQueryClient()

    const { data: transactions, isLoading } = useQuery({
        queryKey: ["transactions", filters],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters.start_date) params.append("start_date", filters.start_date)
            if (filters.end_date) params.append("end_date", filters.end_date)
            if (filters.type !== "ALL") params.append("type", filters.type)
            const res = await api.get(`/transactions/?${params.toString()}`)
            return res.data
        },
    })

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await api.get("/categories/")
            return res.data
        },
    })

    const { data: accounts } = useQuery({
        queryKey: ["accounts"],
        queryFn: async () => {
            const res = await api.get("/accounts/")
            return res.data
        },
    })

    const { data: cards } = useQuery({
        queryKey: ["cards"],
        queryFn: async () => {
            const res = await api.get("/cards/")
            return res.data
        },
    })

    const createMutation = useMutation({
        mutationFn: async (data: Record<string, unknown>) => api.post("/transactions/", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
            queryClient.invalidateQueries({ queryKey: ["cards"] })
            setIsOpen(false)
            toast.success("Transação criada!")
            resetForm()
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
            setIsOpen(false)
            const n = Number(variables.recurrence_months) || 0
            toast.success(`${n} lançamentos recorrentes criados!`)
            resetForm()
        },
        onError: (err: { response?: { data?: { detail?: string } } }) => {
            toast.error(err.response?.data?.detail ?? "Erro ao criar lançamentos recorrentes")
        },
    })

    const updateMutation = useMutation({
        mutationFn: async (data: Record<string, unknown>) =>
            api.put(`/transactions/${editingId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            setIsOpen(false)
            setEditingId(null)
            toast.success("Transação atualizada!")
            resetForm()
        },
        onError: () => toast.error("Erro ao atualizar transação"),
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/transactions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
            queryClient.invalidateQueries({ queryKey: ["cards"] })
            setTransactionToDelete(null)
            toast.success("Transação removida!")
        },
        onError: () => toast.error("Erro ao remover transação"),
    })

    const markPaidMutation = useMutation({
        mutationFn: async ({ id, is_paid }: { id: number; is_paid: boolean }) =>
            api.put(`/transactions/${id}/mark-paid?is_paid=${is_paid}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
            toast.success("Marcado como pago!")
        },
    })

    const resetForm = () => {
        setFormData({ ...defaultFormState })
        setEditingId(null)
    }

    const paymentMethod = formData.payment_method
        ? PAYMENT_METHODS.find((p) => p.id === formData.payment_method)
        : null
    const destination = paymentMethod?.destination ?? "account"
    const conditionConfig = CONDITIONS.find((c) => c.id === formData.condition) ?? CONDITIONS[0]

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

    const openNew = (type: "EXPENSE" | "INCOME") => {
        setEditingId(null)
        setFormData({
            ...defaultFormState,
            transaction_type: type,
            transaction_date: new Date().toISOString().split("T")[0],
        })
        setIsOpen(true)
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

        if (editingId) {
            updateMutation.mutate(buildPayload())
            return
        }

        if (formData.condition === "recorrente") {
            const months = Math.max(1, Math.min(120, parseInt(formData.recurrence_months, 10) || 1))
            const payload = buildPayload()
            delete (payload as Record<string, unknown>).installments
            createRecurringMutation.mutate({
                ...payload,
                recurrence_months: months,
            })
            return
        }

        createMutation.mutate(buildPayload())
    }

    const openEdit = (t: {
        id: number
        description: string
        amount: number
        transaction_type: string
        transaction_date: string
        category_id: number
        account_id: number | null
        card_id: number | null
        installments: number
        is_paid: boolean
    }) => {
        setEditingId(t.id)
        const method = t.card_id
            ? PAYMENT_METHODS.find((m) => m.destination === "card")
            : PAYMENT_METHODS.find((m) => m.destination === "account")
        setFormData({
            description: t.description,
            amount: t.amount.toString(),
            transaction_type: t.transaction_type as "EXPENSE" | "INCOME",
            transaction_date: t.transaction_date.split("T")[0],
            category_id: t.category_id.toString(),
            account_id: t.account_id?.toString() ?? "",
            card_id: t.card_id?.toString() ?? "",
            payment_method: method?.id ?? "",
            condition: t.installments > 1 ? "parcelado" : "a_vista",
            installments: t.installments.toString(),
            recurrence_months: "1",
            is_paid: t.is_paid,
            notes: (t as { notes?: string | null }).notes ?? "",
        })
        setIsOpen(true)
    }

    const filteredCategories = categories?.filter((c: { type: string }) => c.type === formData.transaction_type) ?? []

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Lançamentos</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Input
                        type="date"
                        className="w-auto"
                        value={filters.start_date}
                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    />
                    <Input
                        type="date"
                        className="w-auto"
                        value={filters.end_date}
                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["transactions"] })}
                        title="Atualizar"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="text-destructive border-destructive/50" onClick={() => openNew("EXPENSE")}>
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                        Nova despesa
                    </Button>
                    <Button variant="outline" className="text-green-600 border-green-600/50" onClick={() => openNew("INCOME")}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Nova receita
                    </Button>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar lançamento" : formData.transaction_type === "INCOME" ? "Nova receita" : "Nova despesa"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        {/* 1º Data, 2º Valor (e Tipo só ao editar) */}
                        <div className={cn("grid gap-4", editingId ? "grid-cols-3" : "grid-cols-2")}>
                            {editingId && (
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
                            )}
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

                        {/* Forma de pagamento e Conta/Cartão na mesma linha */}
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

                        {/* Condição */}
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
                            {conditionConfig.showInstallmentsInput && !editingId && (
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
                            {conditionConfig.showRecurrenceInput && !editingId && (
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

                        {/* Já pago */}
                        {paymentMethod && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_paid"
                                    checked={formData.is_paid}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_paid: checked === true })
                                    }
                                />
                                <Label htmlFor="is_paid" className="text-sm font-normal cursor-pointer">
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

                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || createRecurringMutation.isPending}>
                            {editingId ? "Salvar" : formData.condition === "recorrente" ? "Criar lançamentos recorrentes" : "Criar"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Conta/Cartão</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Carregando...</TableCell>
                            </TableRow>
                        ) : transactions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Nenhuma transação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions?.map((t: {
                                id: number
                                transaction_date: string
                                description: string
                                installments: number
                                installment_number: number
                                group_id?: string
                                category: { name: string; color?: string }
                                account: { name: string; logo?: string } | null
                                card: { name: string; logo?: string; brand?: string } | null
                                amount: number
                                transaction_type: string
                                is_paid: boolean
                                card_id: number | null
                                category_id: number
                                account_id: number | null
                            }) => (
                                <TableRow key={t.id}>
                                    <TableCell className="text-xs">{formatDate(t.transaction_date)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{t.description}</span>
                                            {t.installments > 1 && (
                                                <span className="text-xs text-muted-foreground">
                                                    Parcela {t.installment_number}/{t.installments}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold"
                                            style={{
                                                borderColor: t.category?.color ?? "#ccc",
                                                color: t.category?.color ?? "#ccc",
                                            }}
                                        >
                                            {t.category?.name ?? "Sem Categoria"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {t.account ? (
                                            <div className="flex items-center gap-2">
                                                {resolveLogoPath(t.account.logo) ? (
                                                    <img src={resolveLogoPath(t.account.logo)!} alt="" className="h-6 w-6 rounded object-contain bg-muted shrink-0" />
                                                ) : null}
                                                <span className="text-muted-foreground">{t.account.name}</span>
                                            </div>
                                        ) : t.card ? (
                                            <div className="flex items-center gap-2">
                                                {resolveLogoPath(t.card.logo) ? (
                                                    <img src={resolveLogoPath(t.card.logo)!} alt="" className="h-6 w-6 rounded object-contain bg-muted shrink-0" />
                                                ) : null}
                                                {resolveBrandAsset(t.card.brand) && (
                                                    <img src={resolveBrandAsset(t.card.brand)!} alt={t.card.brand ?? ""} className="h-5 w-5 object-contain shrink-0" />
                                                )}
                                                <span className="text-muted-foreground">{t.card.name}</span>
                                            </div>
                                        ) : (
                                            "—"
                                        )}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "text-right font-medium",
                                            t.transaction_type === "INCOME" ? "text-green-600" : "text-red-600",
                                        )}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            {t.transaction_type === "INCOME" ? (
                                                <ArrowUpCircle className="h-3 w-3" />
                                            ) : (
                                                <ArrowDownCircle className="h-3 w-3" />
                                            )}
                                            {formatCurrency(t.amount)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            {!t.is_paid && !t.card_id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 w-8 p-0"
                                                    onClick={() => markPaidMutation.mutate({ id: t.id, is_paid: true })}
                                                    title="Marcar como pago"
                                                >
                                                    $$
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() =>
                                                    setTransactionToDelete({
                                                        id: t.id,
                                                        description: t.description,
                                                        group_id: t.group_id,
                                                    })
                                                }
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir lançamento?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        {transactionToDelete?.group_id
                            ? "Este lançamento faz parte de um grupo (ex.: parcelamento). Excluí-lo irá remover todas as transações vinculadas. Os saldos serão recalculados. Deseja continuar?"
                            : "Tem certeza que deseja excluir? O saldo da conta ou do cartão será recalculado."}
                    </p>
                    {transactionToDelete?.description && (
                        <p className="text-sm font-medium truncate" title={transactionToDelete.description}>
                            &quot;{transactionToDelete.description}&quot;
                        </p>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setTransactionToDelete(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => transactionToDelete && deleteMutation.mutate(transactionToDelete.id)}
                            disabled={deleteMutation.isPending}
                        >
                            Excluir
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
