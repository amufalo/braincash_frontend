import { useState, useCallback, useMemo, useRef } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, CheckCircle, Trash2, FileUp, Save, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PAYMENT_METHODS, CONDITIONS, type PaymentMethodId, type ConditionId } from "@/lib/transaction-form"
import { CategoryIcon } from "@/components/categories/CategoryIcon"
import { ModelSelector } from "@/components/insights/ModelSelector"
import { DEFAULT_MODEL } from "@/lib/insights"

interface PreTransaction {
    id: number
    description: string
    amount: string
    transaction_type: string
    transaction_date: string
    category_id: number | null
    account_id: number | null
    card_id: number | null
    status: string
    created_at: string
    notes?: string | null
}

const defaultProcessFormState = {
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

const defaultBatchFormState = {
    payment_method: "" as PaymentMethodId | "",
    account_id: "",
    card_id: "",
    condition: "a_vista" as ConditionId,
    installments: "1",
    is_paid: true,
}

function buildPayloadForPreTransaction(
    pt: PreTransaction,
    shared: {
        account_id: string
        card_id: string
        condition: ConditionId
        installments: string
        is_paid: boolean
    }
): Record<string, unknown> {
    const dateStr = pt.transaction_date.includes("T")
        ? pt.transaction_date
        : `${pt.transaction_date}T12:00:00Z`
    const installments = Math.max(1, Number(shared.installments) || 1)
    const payload: Record<string, unknown> = {
        description: pt.description,
        amount: Math.abs(Number(pt.amount)),
        transaction_type: pt.transaction_type,
        transaction_date: dateStr,
        category_id: pt.category_id!,
        installments,
        is_paid: shared.is_paid,
        notes: pt.notes?.trim() || null,
    }
    if (shared.account_id) payload.account_id = parseInt(shared.account_id, 10)
    if (shared.card_id) payload.card_id = parseInt(shared.card_id, 10)
    return payload
}

export default function PreTransactions() {
    const [isOpen, setIsOpen] = useState(false)
    const [toDelete, setToDelete] = useState<PreTransaction | null>(null)
    const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)
    const [filterCategory, setFilterCategory] = useState<"all" | "with" | "without">("all")
    const [categorySelection, setCategorySelection] = useState<Record<number, string>>({})
    const [applyCategoryDialog, setApplyCategoryDialog] = useState<{
        pt: PreTransaction
        categoryId: string
        others: PreTransaction[]
    } | null>(null)
    const [importDialogOpen, setImportDialogOpen] = useState(false)
    const [importAccountId, setImportAccountId] = useState("")
    const [importCardId, setImportCardId] = useState("")
    const [importModelId, setImportModelId] = useState(DEFAULT_MODEL)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [processOpen, setProcessOpen] = useState(false)
    const [preTransactionToProcess, setPreTransactionToProcess] = useState<PreTransaction | null>(null)
    const [processFormData, setProcessFormData] = useState(defaultProcessFormState)
    const [batchProcessOpen, setBatchProcessOpen] = useState(false)
    const [batchFormData, setBatchFormData] = useState(defaultBatchFormState)
    const [batchProcessingIndex, setBatchProcessingIndex] = useState<number | null>(null)
    const [formData, setFormData] = useState({
        description: "",
        amount: "0",
        transaction_type: "EXPENSE",
        transaction_date: new Date().toISOString().split("T")[0],
        category_id: "" as string,
        account_id: "" as string,
        card_id: "" as string,
        notes: "",
    })

    const queryClient = useQueryClient()

    const { data: list = [], isLoading } = useQuery({
        queryKey: ["pre-transactions"],
        queryFn: async () => {
            const res = await api.get<PreTransaction[]>("/pre-transactions/")
            return res.data
        },
    })

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

    const createMutation = useMutation({
        mutationFn: async (data: Record<string, unknown>) =>
            api.post("/pre-transactions/", {
                ...data,
                amount: Number(data.amount),
                transaction_date: (data.transaction_date as string) + "T12:00:00Z",
                category_id: data.category_id ? Number(data.category_id) : null,
                account_id: data.account_id ? Number(data.account_id) : null,
                card_id: data.card_id ? Number(data.card_id) : null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pre-transactions"] })
            queryClient.invalidateQueries({ queryKey: ["pre-transactions-count"] })
            setIsOpen(false)
            toast.success("Pré-lançamento criado!")
            setFormData({
                description: "",
                amount: "0",
                transaction_type: "EXPENSE",
                transaction_date: new Date().toISOString().split("T")[0],
                category_id: "",
                account_id: "",
                card_id: "",
                notes: "",
            })
        },
        onError: (err: { response?: { data?: { detail?: string } } }) => {
            toast.error(err.response?.data?.detail || "Erro ao criar")
        },
    })

    /** Create transaction from form, then mark pre-transaction as processed (CONVERTED). */
    const processPreTransactionMutation = useMutation({
        mutationFn: async ({
            payload,
            preTransactionId,
        }: {
            payload: Record<string, unknown>
            preTransactionId: number
        }) => {
            await api.post("/transactions/", payload)
            await api.put(`/pre-transactions/${preTransactionId}`, {
                status: "CONVERTED",
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pre-transactions"] })
            queryClient.invalidateQueries({ queryKey: ["pre-transactions-count"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
            queryClient.invalidateQueries({ queryKey: ["cards"] })
            setProcessOpen(false)
            setPreTransactionToProcess(null)
            setProcessFormData({ ...defaultProcessFormState })
            toast.success("Pré-lançamento processado!")
        },
        onError: (err: { response?: { data?: { detail?: string } } }) => {
            toast.error(err.response?.data?.detail ?? "Erro ao processar")
        },
    })

    /** Process multiple pre-transactions with shared payment options (sequential). */
    const processBatchMutation = useMutation({
        mutationFn: async ({
            items,
            shared,
            onProgress,
        }: {
            items: PreTransaction[]
            shared: typeof defaultBatchFormState
            onProgress?: (index: number) => void
        }) => {
            for (let i = 0; i < items.length; i++) {
                onProgress?.(i)
                const pt = items[i]
                if (!pt.category_id) {
                    throw new Error(`Pré-lançamento "${pt.description}" não tem categoria.`)
                }
                const payload = buildPayloadForPreTransaction(pt, {
                    account_id: shared.account_id,
                    card_id: shared.card_id,
                    condition: shared.condition,
                    installments: shared.installments,
                    is_paid: shared.is_paid,
                })
                await api.post("/transactions/", payload)
                await api.put(`/pre-transactions/${pt.id}`, {
                    status: "CONVERTED",
                })
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["pre-transactions"] })
            queryClient.invalidateQueries({ queryKey: ["pre-transactions-count"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
            queryClient.invalidateQueries({ queryKey: ["cards"] })
            setBatchProcessOpen(false)
            setBatchFormData({ ...defaultBatchFormState })
            setBatchProcessingIndex(null)
            const count = variables.items.length
            toast.success(
                count === 1
                    ? "1 pré-lançamento processado!"
                    : `${count} pré-lançamentos processados!`
            )
        },
        onError: (err: { response?: { data?: { detail?: string } } }) => {
            setBatchProcessingIndex(null)
            toast.error(err.response?.data?.detail ?? (err as Error).message ?? "Erro ao processar em lote")
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/pre-transactions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pre-transactions"] })
            queryClient.invalidateQueries({ queryKey: ["pre-transactions-count"] })
            setToDelete(null)
            toast.success("Pré-lançamento removido")
        },
        onError: (err: { response?: { data?: { detail?: string } } }) => {
            toast.error(err.response?.data?.detail || "Erro ao remover")
        },
    })

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            const res = await api.delete<{ detail: string; deleted: number }>("/pre-transactions/")
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["pre-transactions"] })
            queryClient.invalidateQueries({ queryKey: ["pre-transactions-count"] })
            setDeleteAllConfirmOpen(false)
            toast.success(data.detail || "Todos os pré-lançamentos foram removidos")
        },
        onError: (err: { response?: { data?: { detail?: string } } }) => {
            toast.error(err.response?.data?.detail || "Erro ao remover")
        },
    })

    const updateCategoryMutation = useMutation({
        mutationFn: async ({
            ids,
            categoryId,
        }: {
            ids: number[]
            categoryId: number
        }) => {
            await Promise.all(
                ids.map((id) =>
                    api.put(`/pre-transactions/${id}`, { category_id: categoryId })
                )
            )
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["pre-transactions"] })
            queryClient.invalidateQueries({ queryKey: ["category-description-counts"] })
            queryClient.invalidateQueries({
                queryKey: ["category-description-mappings", variables.categoryId],
            })
            setApplyCategoryDialog(null)
            setCategorySelection((prev) => {
                const next = { ...prev }
                variables.ids.forEach((id) => delete next[id])
                return next
            })
            if (variables.ids.length > 1) {
                toast.success(`${variables.ids.length} pré-lançamentos atualizados`)
            } else {
                toast.success("Categoria atualizada")
            }
        },
        onError: (err: { response?: { data?: { detail?: string } } }) => {
            toast.error(err.response?.data?.detail || "Erro ao atualizar categoria")
        },
    })

    const importInvoiceMutation = useMutation({
        mutationFn: async ({
            file,
            accountId,
            cardId,
            modelId,
        }: {
            file: File
            accountId?: string
            cardId?: string
            modelId?: string
        }) => {
            const formData = new FormData()
            formData.append("file", file)
            if (accountId) formData.append("account_id", accountId)
            if (cardId) formData.append("card_id", cardId)
            if (modelId) formData.append("model_id", modelId)
            const res = await api.post<{
                created: number
                duplicates_skipped: number
                total_extracted: number
            }>("/pre-transactions/import-invoice", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["pre-transactions"] })
            queryClient.invalidateQueries({ queryKey: ["pre-transactions-count"] })
            const msg =
                data.created > 0
                    ? `${data.created} pré-lançamento(s) importado(s).`
                    : "Nenhum novo pré-lançamento criado."
            if (data.duplicates_skipped > 0) {
                toast.success(`${msg} ${data.duplicates_skipped} duplicata(s) ignorada(s).`)
            } else {
                toast.success(msg)
            }
        },
        onError: (err: { response?: { data?: { detail?: string } } }) => {
            toast.error(err.response?.data?.detail || "Erro ao importar fatura")
        },
    })

    const pending = list.filter((x) => x.status === "PENDING")
    const filteredPending =
        filterCategory === "with"
            ? pending.filter((x) => !!x.category_id)
            : filterCategory === "without"
              ? pending.filter((x) => !x.category_id)
              : pending

    const handleImportInvoiceClick = () => {
        setImportAccountId("")
        setImportCardId("")
        setImportDialogOpen(true)
    }

    const handleImportDialogSelectPdf = () => {
        if (!importAccountId && !importCardId) {
            toast.error("Selecione uma conta ou um cartão.")
            return
        }
        setImportDialogOpen(false)
        fileInputRef.current?.click()
    }

    const handleImportInvoiceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        if (!file.name.toLowerCase().endsWith(".pdf")) {
            toast.error("Selecione um arquivo PDF.")
            return
        }
        importInvoiceMutation.mutate({
            file,
            accountId: importAccountId || undefined,
            cardId: importCardId || undefined,
            modelId: importModelId || undefined,
        })
    }

    const handleSubmit = () => {
        if (!formData.description.trim()) {
            toast.error("Descrição é obrigatória")
            return
        }
        if (Number(formData.amount) <= 0) {
            toast.error("Valor deve ser maior que zero")
            return
        }
        createMutation.mutate(formData as unknown as Record<string, unknown>)
    }

    const paymentMethod = processFormData.payment_method
        ? PAYMENT_METHODS.find((p) => p.id === processFormData.payment_method)
        : null
    const destination = paymentMethod?.destination ?? "account"
    const conditionConfig = CONDITIONS.find((c) => c.id === processFormData.condition) ?? CONDITIONS[0]

    const batchPaymentMethod = batchFormData.payment_method
        ? PAYMENT_METHODS.find((p) => p.id === batchFormData.payment_method)
        : null
    const batchDestination = batchPaymentMethod?.destination ?? "account"
    const batchConditionConfig = CONDITIONS.find((c) => c.id === batchFormData.condition) ?? CONDITIONS[0]

    const applyProcessPaymentMethodDefaults = useCallback((methodId: PaymentMethodId) => {
        const method = PAYMENT_METHODS.find((m) => m.id === methodId)
        if (!method) return
        setProcessFormData((prev) => ({
            ...prev,
            payment_method: methodId,
            account_id: method.destination === "account" ? prev.account_id : "",
            card_id: method.destination === "card" ? prev.card_id : "",
            is_paid: method.isPaidByDefault,
        }))
    }, [])

    const applyBatchPaymentMethodDefaults = useCallback((methodId: PaymentMethodId) => {
        const method = PAYMENT_METHODS.find((m) => m.id === methodId)
        if (!method) return
        setBatchFormData((prev) => ({
            ...prev,
            payment_method: methodId,
            account_id: method.destination === "account" ? prev.account_id : "",
            card_id: method.destination === "card" ? prev.card_id : "",
            is_paid: method.isPaidByDefault,
        }))
    }, [])

    const openBatchProcessDialog = useCallback(() => {
        const items = filteredPending
        let initial = { ...defaultBatchFormState }
        if (items.length > 0) {
            const firstCard = items[0].card_id
            const firstAccount = items[0].account_id
            const allSameCard =
                firstCard != null && items.every((pt) => pt.card_id === firstCard)
            const allSameAccount =
                firstAccount != null && items.every((pt) => pt.account_id === firstAccount)
            if (allSameCard) {
                const method = PAYMENT_METHODS.find((m) => m.destination === "card")
                initial = {
                    ...defaultBatchFormState,
                    card_id: String(firstCard),
                    payment_method: (method?.id ?? "") as PaymentMethodId | "",
                    account_id: "",
                    is_paid: method?.isPaidByDefault ?? true,
                }
            } else if (allSameAccount) {
                const method = PAYMENT_METHODS.find((m) => m.destination === "account")
                initial = {
                    ...defaultBatchFormState,
                    account_id: String(firstAccount),
                    payment_method: (method?.id ?? "") as PaymentMethodId | "",
                    card_id: "",
                    is_paid: method?.isPaidByDefault ?? true,
                }
            }
        }
        setBatchFormData(initial)
        setBatchProcessOpen(true)
    }, [filteredPending])

    const openProcessDialog = useCallback((pt: PreTransaction) => {
        setPreTransactionToProcess(pt)
        const method = pt.card_id
            ? PAYMENT_METHODS.find((m) => m.destination === "card")
            : PAYMENT_METHODS.find((m) => m.destination === "account")
        const dateStr = pt.transaction_date.includes("T")
            ? pt.transaction_date
            : `${pt.transaction_date}T12:00:00Z`
        setProcessFormData({
            ...defaultProcessFormState,
            description: pt.description,
            amount: String(Math.abs(Number(pt.amount))),
            transaction_type: pt.transaction_type as "EXPENSE" | "INCOME",
            transaction_date: dateStr.slice(0, 10),
            category_id: pt.category_id?.toString() ?? "",
            account_id: pt.account_id?.toString() ?? "",
            card_id: pt.card_id?.toString() ?? "",
            payment_method: method?.id ?? "",
            condition: "a_vista",
            installments: "1",
            is_paid: true,
            notes: pt.notes ?? "",
        })
        setProcessOpen(true)
    }, [])

    const buildProcessPayload = useCallback(() => {
        const date = processFormData.transaction_date
        const installments = Math.max(1, Number(processFormData.installments) || 1)
        const payload: Record<string, unknown> = {
            description: processFormData.description,
            amount: parseFloat(processFormData.amount),
            transaction_type: processFormData.transaction_type,
            transaction_date: date.includes("T") ? date : `${date}T12:00:00Z`,
            category_id: parseInt(processFormData.category_id, 10),
            installments,
            is_paid: processFormData.is_paid,
            notes: processFormData.notes?.trim() || null,
        }
        if (processFormData.account_id)
            payload.account_id = parseInt(processFormData.account_id, 10)
        if (processFormData.card_id)
            payload.card_id = parseInt(processFormData.card_id, 10)
        return payload
    }, [processFormData])

    const handleProcessSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!preTransactionToProcess) return
        const payload = buildProcessPayload()
        if (!payload.category_id || (!payload.account_id && !payload.card_id)) {
            toast.error("Preencha categoria e conta ou cartão")
            return
        }
        processPreTransactionMutation.mutate({
            payload,
            preTransactionId: preTransactionToProcess.id,
        })
    }

    const handleBatchProcessSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const needAccount = batchDestination === "account"
        const needCard = batchDestination === "card"
        if (needAccount && !batchFormData.account_id) {
            toast.error("Selecione a conta")
            return
        }
        if (needCard && !batchFormData.card_id) {
            toast.error("Selecione o cartão")
            return
        }
        processBatchMutation.mutate({
            items: filteredPending,
            shared: batchFormData,
            onProgress: setBatchProcessingIndex,
        })
    }

    const filteredProcessCategories =
        useMemo(
            () =>
                categories?.filter(
                    (c: { type: string }) => c.type === processFormData.transaction_type
                ) ?? [],
            [categories, processFormData.transaction_type]
        )

    const getCategoriesByType = useCallback(
        (type: string) =>
            (categories as { id: number; name: string; type: string }[])?.filter(
                (c) => c.type === type
            ) ?? [],
        [categories]
    )

    const handleGravarCategory = (pt: PreTransaction) => {
        const categoryId = categorySelection[pt.id] ?? pt.category_id?.toString() ?? ""
        if (!categoryId) {
            toast.error("Selecione uma categoria")
            return
        }
        // Só agrupar por descrição + tipo: mesma descrição com tipo diferente pode ter categoria diferente
        const others = pending.filter(
            (p) =>
                p.id !== pt.id &&
                p.description === pt.description &&
                p.transaction_type === pt.transaction_type
        )
        if (others.length > 0) {
            setApplyCategoryDialog({ pt, categoryId, others })
        } else {
            updateCategoryMutation.mutate({
                ids: [pt.id],
                categoryId: parseInt(categoryId, 10),
            })
        }
    }

    const handleApplyCategoryOnlyThis = () => {
        if (!applyCategoryDialog) return
        updateCategoryMutation.mutate({
            ids: [applyCategoryDialog.pt.id],
            categoryId: parseInt(applyCategoryDialog.categoryId, 10),
        })
    }

    const handleApplyCategoryToAll = () => {
        if (!applyCategoryDialog) return
        const allIds = [
            applyCategoryDialog.pt.id,
            ...applyCategoryDialog.others.map((o) => o.id),
        ]
        updateCategoryMutation.mutate({
            ids: allIds,
            categoryId: parseInt(applyCategoryDialog.categoryId, 10),
        })
    }

    const totalPendentes = useMemo(() => {
        let total = 0
        for (const pt of filteredPending) {
            const amt = Number(pt.amount)
            total += pt.transaction_type === "EXPENSE" ? amt : -amt
        }
        return total
    }, [filteredPending])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Pré-Lançamentos
                </h2>
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handleImportInvoiceFile}
                    />
                    <Button
                        variant="outline"
                        onClick={handleImportInvoiceClick}
                        disabled={importInvoiceMutation.isPending}
                    >
                        <FileUp className="mr-2 h-4 w-4" />
                        {importInvoiceMutation.isPending ? "Importando..." : "Importar fatura"}
                    </Button>
                    <Button onClick={() => setIsOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo
                    </Button>
                    {filteredPending.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={openBatchProcessDialog}
                            disabled={
                                processBatchMutation.isPending ||
                                filteredPending.some((pt) => !pt.category_id)
                            }
                            title={
                                filteredPending.some((pt) => !pt.category_id)
                                    ? "Atribua categoria a todos os itens ou use o filtro 'Com categoria'."
                                    : undefined
                            }
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Processar filtrados
                        </Button>
                    )}
                    {pending.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setDeleteAllConfirmOpen(true)}
                            disabled={deleteAllMutation.isPending}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover tudo
                        </Button>
                    )}
                </div>
            </div>

            {pending.length > 0 && (
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Filtrar:</span>
                        <div className="flex rounded-md border p-1" role="radiogroup" aria-label="Filtrar por categoria">
                            <Button
                                variant={filterCategory === "all" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setFilterCategory("all")}
                            >
                                Todos
                            </Button>
                            <Button
                                variant={filterCategory === "with" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setFilterCategory("with")}
                            >
                                Com categoria
                            </Button>
                            <Button
                                variant={filterCategory === "without" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setFilterCategory("without")}
                            >
                                Sem categoria
                            </Button>
                        </div>
                    </div>
                    <Card className="w-fit">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                            Total dos pré-lançamentos
                        </p>
                        <p className="text-2xl font-bold">
                            {formatCurrency(totalPendentes)}
                        </p>
                    </CardContent>
                </Card>
                </div>
            )}

            {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
            ) : pending.length === 0 ? (
                <p className="text-muted-foreground">
                    Nenhum pré-lançamento pendente.
                </p>
            ) : filteredPending.length === 0 ? (
                <p className="text-muted-foreground">
                    {filterCategory === "with"
                        ? "Nenhum pré-lançamento com categoria."
                        : filterCategory === "without"
                          ? "Nenhum pré-lançamento sem categoria."
                          : "Nenhum pré-lançamento pendente."}
                </p>
            ) : (
                <div className="rounded-md border overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                    <Table className="min-w-[640px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead className="w-[120px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPending.map((pt) => {
                                const rowCategories = getCategoriesByType(pt.transaction_type)
                                return (
                                    <TableRow key={pt.id}>
                                        <TableCell>
                                            {formatDate(pt.transaction_date)}
                                        </TableCell>
                                        <TableCell>{pt.description}</TableCell>
                                        <TableCell>
                                            <span className={pt.transaction_type === "INCOME" ? "text-green-600" : "text-red-600"}>
                                                {pt.transaction_type === "INCOME" ? "Receita" : "Despesa"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(Number(pt.amount))}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={
                                                        categorySelection[pt.id] ??
                                                        pt.category_id?.toString() ??
                                                        ""
                                                    }
                                                    onValueChange={(v) =>
                                                        setCategorySelection((prev) => ({
                                                            ...prev,
                                                            [pt.id]: v,
                                                        }))
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-[160px]">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {rowCategories.map(
                                                            (c: { id: number; name: string; icon?: string; color?: string }) => (
                                                                <SelectItem
                                                                    key={c.id}
                                                                    value={String(c.id)}
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        <CategoryIcon icon={c.icon} color={c.color} className="h-4 w-4 shrink-0" />
                                                                        {c.name}
                                                                    </span>
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleGravarCategory(pt)}
                                                    disabled={
                                                        updateCategoryMutation.isPending
                                                    }
                                                    title="Gravar categoria"
                                                >
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openProcessDialog(pt)}
                                                    disabled={
                                                        processPreTransactionMutation.isPending
                                                    }
                                                    title="Processar: abrir formulário de lançamento"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    Processar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setToDelete(pt)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Create dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo pré-lançamento</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label>Descrição</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="Ex: Compra mercado"
                            />
                        </div>
                        <div>
                            <Label>Valor</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        amount: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Tipo</Label>
                            <Select
                                value={formData.transaction_type}
                                onValueChange={(v) =>
                                    setFormData((p) => ({
                                        ...p,
                                        transaction_type: v,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                                    <SelectItem value="INCOME">Receita</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={formData.transaction_date}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        transaction_date: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Categoria</Label>
                            <Select
                                value={formData.category_id}
                                onValueChange={(v) =>
                                    setFormData((p) => ({
                                        ...p,
                                        category_id: v,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opcional" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c: { id: number; name: string; icon?: string; color?: string }) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            <span className="flex items-center gap-2">
                                                <CategoryIcon icon={c.icon} color={c.color} className="h-4 w-4 shrink-0" />
                                                {c.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Conta</Label>
                            <Select
                                value={formData.account_id}
                                onValueChange={(v) =>
                                    setFormData((p) => ({ ...p, account_id: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opcional" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((a: { id: number; name: string }) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Cartão</Label>
                            <Select
                                value={formData.card_id}
                                onValueChange={(v) =>
                                    setFormData((p) => ({ ...p, card_id: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opcional" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cards.map((c: { id: number; name: string }) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={createMutation.isPending}
                            >
                                Salvar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Importar fatura: selecionar conta/cartão e modelo de IA antes de escolher o PDF */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar fatura</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">
                        Para qual conta ou cartão enviar os lançamentos importados?
                    </p>
                    <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3 flex gap-3">
                        <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <p className="text-sm text-card-foreground">
                            <strong>Aviso:</strong> O PDF será enviado ao provedor de IA escolhido para extração dos lançamentos. Certifique-se de que você confia no provedor antes de prosseguir.
                        </p>
                    </div>
                    <div className="grid gap-4 py-4">
                        <ModelSelector
                            value={importModelId}
                            onValueChange={setImportModelId}
                            disabled={importInvoiceMutation.isPending}
                            title="Modelo de IA para extração"
                            description="Escolha o provedor de IA (OpenAI ou Anthropic Claude) e o modelo que será utilizado para extrair os lançamentos do PDF da fatura."
                            compact
                        />
                        <div>
                            <Label>Conta</Label>
                            <Select
                                value={importAccountId}
                                onValueChange={(v) => {
                                    setImportAccountId(v)
                                    if (v) setImportCardId("")
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((a: { id: number; name: string }) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>ou Cartão</Label>
                            <Select
                                value={importCardId}
                                onValueChange={(v) => {
                                    setImportCardId(v)
                                    if (v) setImportAccountId("")
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o cartão" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cards.map((c: { id: number; name: string }) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setImportDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleImportDialogSelectPdf}>
                                Selecionar PDF
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Processar: criar lançamento a partir do pré-lançamento e marcar como processado */}
            <Dialog
                open={processOpen}
                onOpenChange={(open) => {
                    setProcessOpen(open)
                    if (!open) {
                        setPreTransactionToProcess(null)
                        setProcessFormData({ ...defaultProcessFormState })
                    }
                }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Processar pré-lançamento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleProcessSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    value={processFormData.transaction_date}
                                    onChange={(e) =>
                                        setProcessFormData({
                                            ...processFormData,
                                            transaction_date: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Valor (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={processFormData.amount}
                                    onChange={(e) =>
                                        setProcessFormData({
                                            ...processFormData,
                                            amount: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Descrição</Label>
                            <Input
                                value={processFormData.description}
                                onChange={(e) =>
                                    setProcessFormData({
                                        ...processFormData,
                                        description: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tipo</Label>
                            <Select
                                value={processFormData.transaction_type}
                                onValueChange={(val) =>
                                    setProcessFormData({
                                        ...processFormData,
                                        transaction_type: val as "EXPENSE" | "INCOME",
                                        category_id: "",
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                                    <SelectItem value="INCOME">Receita</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Select
                                value={processFormData.category_id}
                                onValueChange={(val) =>
                                    setProcessFormData({
                                        ...processFormData,
                                        category_id: val,
                                    })
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredProcessCategories.map(
                                        (c: { id: number; name: string; icon?: string; color?: string }) => (
                                            <SelectItem
                                                key={c.id}
                                                value={c.id.toString()}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <CategoryIcon icon={c.icon} color={c.color} className="h-4 w-4 shrink-0" />
                                                    {c.name}
                                                </span>
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Forma de pagamento</Label>
                                <Select
                                    value={processFormData.payment_method || undefined}
                                    onValueChange={(val) =>
                                        applyProcessPaymentMethodDefaults(
                                            val as PaymentMethodId
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a forma de pagamento" />
                                    </SelectTrigger>
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
                                    <Label>
                                        {destination === "account"
                                            ? "Conta"
                                            : "Cartão"}
                                    </Label>
                                    {destination === "account" ? (
                                        <Select
                                            value={
                                                processFormData.account_id || undefined
                                            }
                                            onValueChange={(val) =>
                                                setProcessFormData({
                                                    ...processFormData,
                                                    account_id: val,
                                                })
                                            }
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a conta" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts?.map(
                                                    (a: {
                                                        id: number
                                                        name: string
                                                    }) => (
                                                        <SelectItem
                                                            key={a.id}
                                                            value={a.id.toString()}
                                                        >
                                                            {a.name}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Select
                                            value={
                                                processFormData.card_id || undefined
                                            }
                                            onValueChange={(val) =>
                                                setProcessFormData({
                                                    ...processFormData,
                                                    card_id: val,
                                                })
                                            }
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o cartão" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cards?.map(
                                                    (c: {
                                                        id: number
                                                        name: string
                                                    }) => (
                                                        <SelectItem
                                                            key={c.id}
                                                            value={c.id.toString()}
                                                        >
                                                            {c.name}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="rounded-lg border p-4 space-y-4">
                            <Label className="text-sm font-medium">Condição</Label>
                            <div className="flex flex-wrap gap-2">
                                {CONDITIONS.filter((c) => c.id !== "recorrente").map(
                                    (c) => (
                                        <Button
                                            key={c.id}
                                            type="button"
                                            variant={
                                                processFormData.condition === c.id
                                                    ? "secondary"
                                                    : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                                setProcessFormData({
                                                    ...processFormData,
                                                    condition: c.id,
                                                    installments:
                                                        c.installmentsDefault.toString(),
                                                })
                                            }
                                        >
                                            {c.label}
                                        </Button>
                                    )
                                )}
                            </div>
                            {conditionConfig.showInstallmentsInput && (
                                <div className="grid gap-2 max-w-[140px]">
                                    <Label className="text-xs">
                                        Número de parcelas
                                    </Label>
                                    <Input
                                        type="number"
                                        min="2"
                                        value={processFormData.installments}
                                        onChange={(e) =>
                                            setProcessFormData({
                                                ...processFormData,
                                                installments: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        {paymentMethod && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="process_is_paid"
                                    checked={processFormData.is_paid}
                                    onCheckedChange={(checked) =>
                                        setProcessFormData({
                                            ...processFormData,
                                            is_paid: checked === true,
                                        })
                                    }
                                />
                                <Label
                                    htmlFor="process_is_paid"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Lançamento já pago
                                </Label>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Observação</Label>
                            <Input
                                value={processFormData.notes}
                                onChange={(e) =>
                                    setProcessFormData({
                                        ...processFormData,
                                        notes: e.target.value,
                                    })
                                }
                                placeholder="Opcional"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={processPreTransactionMutation.isPending}
                        >
                            {processPreTransactionMutation.isPending
                                ? "Salvando..."
                                : "Criar lançamento e marcar como processado"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Processar filtrados em lote */}
            <Dialog
                open={batchProcessOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setBatchProcessOpen(false)
                        setBatchFormData({ ...defaultBatchFormState })
                        setBatchProcessingIndex(null)
                    }
                }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Processar {filteredPending.length} pré-lançamento(s)
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground text-sm">
                        Será usada a mesma forma de pagamento e conta/cartão para todos.
                        Descrição, valor, data e categoria vêm de cada pré-lançamento.
                    </p>
                    <form onSubmit={handleBatchProcessSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Forma de pagamento</Label>
                                <Select
                                    value={batchFormData.payment_method || undefined}
                                    onValueChange={(val) =>
                                        applyBatchPaymentMethodDefaults(val as PaymentMethodId)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a forma de pagamento" />
                                    </SelectTrigger>
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
                            {batchPaymentMethod && (
                                <div className="grid gap-2">
                                    <Label>
                                        {batchDestination === "account" ? "Conta" : "Cartão"}
                                    </Label>
                                    {batchDestination === "account" ? (
                                        <Select
                                            value={batchFormData.account_id || undefined}
                                            onValueChange={(val) =>
                                                setBatchFormData((prev) => ({ ...prev, account_id: val }))
                                            }
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a conta" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts?.map((a: { id: number; name: string }) => (
                                                    <SelectItem key={a.id} value={a.id.toString()}>
                                                        {a.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Select
                                            value={batchFormData.card_id || undefined}
                                            onValueChange={(val) =>
                                                setBatchFormData((prev) => ({ ...prev, card_id: val }))
                                            }
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o cartão" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cards?.map((c: { id: number; name: string }) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name}
                                                    </SelectItem>
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
                                {CONDITIONS.filter((c) => c.id !== "recorrente").map((c) => (
                                    <Button
                                        key={c.id}
                                        type="button"
                                        variant={
                                            batchFormData.condition === c.id ? "secondary" : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setBatchFormData((prev) => ({
                                                ...prev,
                                                condition: c.id,
                                                installments: c.installmentsDefault.toString(),
                                            }))
                                        }
                                    >
                                        {c.label}
                                    </Button>
                                ))}
                            </div>
                            {batchConditionConfig.showInstallmentsInput && (
                                <div className="grid gap-2 max-w-[140px]">
                                    <Label className="text-xs">Número de parcelas</Label>
                                    <Input
                                        type="number"
                                        min="2"
                                        value={batchFormData.installments}
                                        onChange={(e) =>
                                            setBatchFormData((prev) => ({
                                                ...prev,
                                                installments: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        {batchPaymentMethod && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="batch_is_paid"
                                    checked={batchFormData.is_paid}
                                    onCheckedChange={(checked) =>
                                        setBatchFormData((prev) => ({
                                            ...prev,
                                            is_paid: checked === true,
                                        }))
                                    }
                                />
                                <Label
                                    htmlFor="batch_is_paid"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Lançamento já pago
                                </Label>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-2 pt-2">
                            {batchProcessingIndex !== null ? (
                                <span className="text-sm text-muted-foreground">
                                    Processando {batchProcessingIndex + 1} de {filteredPending.length}...
                                </span>
                            ) : (
                                <span />
                            )}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setBatchProcessOpen(false)}
                                    disabled={processBatchMutation.isPending}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processBatchMutation.isPending || !batchFormData.payment_method}
                                >
                                    {processBatchMutation.isPending
                                        ? "Processando..."
                                        : `Processar ${filteredPending.length} itens`}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover pré-lançamento</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">
                        Remover &quot;{toDelete?.description}&quot;? Esta ação não
                        pode ser desfeita.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setToDelete(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                toDelete && deleteMutation.mutate(toDelete.id)
                            }
                            disabled={deleteMutation.isPending}
                        >
                            Remover
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete all confirm */}
            <Dialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover todos os pré-lançamentos</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">
                        Remover todos os {pending.length} pré-lançamento(s) pendente(s)?
                        Útil para refazer uma importação. Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteAllConfirmOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteAllMutation.mutate()}
                            disabled={deleteAllMutation.isPending}
                        >
                            {deleteAllMutation.isPending ? "Removendo..." : "Remover tudo"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Aplicar categoria aos mesmos: só este ou todos com mesma descrição */}
            <Dialog
                open={!!applyCategoryDialog}
                onOpenChange={(open) => !open && setApplyCategoryDialog(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Atribuir categoria</DialogTitle>
                    </DialogHeader>
                    {applyCategoryDialog && (
                        <>
                            <p className="text-muted-foreground">
                                Existem {applyCategoryDialog.others.length} outro(s) pré-lançamento(s)
                                com a descrição &quot;{applyCategoryDialog.pt.description}&quot; e tipo &quot;
                                {applyCategoryDialog.pt.transaction_type === "INCOME" ? "Receita" : "Despesa"}&quot;.
                                Deseja atribuir a categoria a todos?
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setApplyCategoryDialog(null)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleApplyCategoryOnlyThis}
                                    disabled={updateCategoryMutation.isPending}
                                >
                                    Só este
                                </Button>
                                <Button
                                    onClick={handleApplyCategoryToAll}
                                    disabled={updateCategoryMutation.isPending}
                                >
                                    Aplicar a todos
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
