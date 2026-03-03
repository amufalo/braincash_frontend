import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, CreditCard, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { resolveLogoPath, resolveBrandAsset, normalizeLogo } from "@/lib/logo"
import { LogoPickerTrigger, LogoPickerDialog } from "@/components/logo-picker"
import { useLogoSelection } from "@/hooks/use-logo-selection"

export default function Cards() {
    const [isOpen, setIsOpen] = useState(false)
    const [logoDialogOpen, setLogoDialogOpen] = useState(false)
    const [payBillOpen, setPayBillOpen] = useState(false)
    const [selectedCard, setSelectedCard] = useState<any>(null)

    const [formData, setFormData] = useState({
        name: "",
        bank_name: "",
        logo: "",
        card_number: "",
        brand: "Visa",
        credit_limit: "0",
        closing_day: "1",
        due_day: "10",
    })

    // Pay Bill Form
    const [payBillData, setPayBillData] = useState({
        amount: "",
        account_id: "",
    })

    const queryClient = useQueryClient()

    // Queries
    const { data: cards, isLoading } = useQuery({
        queryKey: ['cards'],
        queryFn: async () => {
            const res = await api.get('/cards/')
            return res.data
        }
    })

    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/accounts/')
            return res.data
        }
    })

    const { data: logoOptions = [] } = useQuery({
        queryKey: ['logo-options'],
        queryFn: async () => {
            const res = await fetch('/logos-list.json')
            if (!res.ok) return []
            const json = await res.json()
            return Array.isArray(json) ? json : []
        },
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: any) => await api.post('/cards/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cards'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            setIsOpen(false)
            toast.success("Cartão criado com sucesso!")
            resetForm()
        },
        onError: () => toast.error("Erro ao criar cartão")
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) => await api.put(`/cards/${selectedCard.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cards'] })
            setIsOpen(false)
            setSelectedCard(null)
            toast.success("Cartão atualizado!")
            resetForm()
        },
        onError: () => toast.error("Erro ao atualizar cartão")
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => await api.delete(`/cards/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cards'] })
            toast.success("Cartão removido!")
        },
        onError: () => toast.error("Erro ao remover cartão")
    })

    const payBillMutation = useMutation({
        mutationFn: async (data: any) => {
            // POST /cards/{id}/pay-bill
            // Body: { amount, account_id }
            return await api.post(`/cards/${selectedCard.id}/pay-bill`, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cards'] })
            queryClient.invalidateQueries({ queryKey: ['accounts'] }) // Account balance changes
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            setPayBillOpen(false)
            setSelectedCard(null)
            toast.success("Fatura paga com sucesso!")
        },
        onError: (err: any) => {
            console.error(err)
            toast.error("Erro ao pagar fatura")
        }
    })

    // Handlers
    const resetForm = () => {
        setFormData({
            name: "",
            bank_name: "",
            logo: logoOptions[0] ?? "",
            card_number: "",
            brand: "Visa",
            credit_limit: "0",
            closing_day: "1",
            due_day: "10",
        })
        setSelectedCard(null)
        setPayBillData({ amount: "", account_id: "" })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            ...formData,
            logo: formData.logo?.trim() || null,
            credit_limit: parseFloat(formData.credit_limit),
            closing_day: parseInt(formData.closing_day),
            due_day: parseInt(formData.due_day),
        }

        if (selectedCard) {
            updateMutation.mutate(payload)
        } else {
            createMutation.mutate(payload)
        }
    }

    const handlePayBillSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCard) return
        payBillMutation.mutate({
            amount: parseFloat(payBillData.amount),
            account_id: parseInt(payBillData.account_id)
        })
    }

    const openEdit = (card: any) => {
        setSelectedCard(card)
        const fallbackLogo = logoOptions[0] ?? ""
        const selectedLogo = normalizeLogo(card.logo) || fallbackLogo
        setFormData({
            name: card.name,
            bank_name: card.bank_name ?? "",
            logo: selectedLogo,
            card_number: card.card_number ?? "",
            brand: card.brand ?? "Visa",
            credit_limit: card.credit_limit.toString(),
            closing_day: card.closing_day.toString(),
            due_day: card.due_day.toString(),
        })
        setIsOpen(true)
    }

    const handleLogoSelection = useLogoSelection({
        mode: selectedCard ? "update" : "create",
        currentLogo: formData.logo,
        currentName: formData.name,
        onUpdate: (updates) => {
            setFormData((prev) => ({ ...prev, ...updates }))
            requestAnimationFrame(() => setLogoDialogOpen(false))
        },
    })

    const handleCardDialogOpenChange = (open: boolean) => {
        if (!open) {
            if (logoDialogOpen) return
            setLogoDialogOpen(false)
            resetForm()
            setIsOpen(false)
            return
        }
        if (!selectedCard) {
            setFormData((prev) => ({
                ...prev,
                name: "",
                bank_name: "",
                logo: logoOptions[0] ?? "",
                card_number: "",
                brand: "Visa",
                credit_limit: "0",
                closing_day: "1",
                due_day: "10",
            }))
        }
        setIsOpen(open)
    }

    const openPayBill = (card: any) => {
        setSelectedCard(card)
        setPayBillData({ amount: card.current_balance.toString(), account_id: "" })
        setPayBillOpen(true)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Cartões de Crédito</h2>
                <Dialog open={isOpen} onOpenChange={handleCardDialogOpenChange}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Novo Cartão</Button>
                    </DialogTrigger>
                    <DialogContent
                        onPointerDownOutside={(e) => { if (logoDialogOpen) e.preventDefault() }}
                        onInteractOutside={(e) => { if (logoDialogOpen) e.preventDefault() }}
                    >
                        <DialogHeader>
                            <DialogTitle>{selectedCard ? "Editar Cartão" : "Novo Cartão"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <LogoPickerTrigger
                                    selectedLogo={formData.logo || null}
                                    disabled={logoOptions.length === 0}
                                    helperText="Clique para escolher o logo do cartão"
                                    placeholder="Selecionar logo"
                                    onOpen={() => { if (logoOptions.length > 0) setLogoDialogOpen(true) }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nome</Label>
                                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="bank">Banco / Instituição</Label>
                                    <Input id="bank" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="brand">Bandeira</Label>
                                    <select
                                        id="brand"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    >
                                        <option value="Visa">Visa</option>
                                        <option value="Mastercard">Mastercard</option>
                                        <option value="Elo">Elo</option>
                                        <option value="Hipercard">Hipercard</option>
                                        <option value="Amex">Amex</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="number">Final Cartão (4 dígitos)</Label>
                                    <Input id="number" maxLength={4} value={formData.card_number} onChange={(e) => setFormData({ ...formData, card_number: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="limit">Limite</Label>
                                    <Input id="limit" type="number" step="0.01" value={formData.credit_limit} onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="closing">Dia Fechamento</Label>
                                    <Input id="closing" type="number" min="1" max="31" value={formData.closing_day} onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="due">Dia Vencimento</Label>
                                    <Input id="due" type="number" min="1" max="31" value={formData.due_day} onChange={(e) => setFormData({ ...formData, due_day: e.target.value })} required />
                                </div>
                            </div>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {selectedCard ? "Salvar" : "Criar"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
                <LogoPickerDialog
                    open={logoDialogOpen}
                    logos={logoOptions}
                    value={formData.logo}
                    onOpenChange={setLogoDialogOpen}
                    onSelect={handleLogoSelection}
                    title="Escolher logo da instituição"
                    description="Selecione o logo que será usado para identificar este cartão."
                />
            </div>

            {/* PAY BILL DIALOG */}
            <Dialog open={payBillOpen} onOpenChange={(open) => { setPayBillOpen(open); if (!open) resetForm(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pagar Fatura - {selectedCard?.name}</DialogTitle>
                        <DialogDescription>
                            O pagamento será registrado como uma despesa na conta selecionada e reduzirá o saldo devedor do cartão.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayBillSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Conta para Pagamento</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={payBillData.account_id}
                                onChange={(e) => setPayBillData({ ...payBillData, account_id: e.target.value })}
                                required
                            >
                                <option value="">Selecione uma conta...</option>
                                {accounts?.map((acc: any) => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.current_balance)})</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Valor do Pagamento</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={payBillData.amount}
                                onChange={(e) => setPayBillData({ ...payBillData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={payBillMutation.isPending}>Confirmar Pagamento</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead className="text-right">Limite</TableHead>
                            <TableHead className="text-right">Fatura Atual</TableHead>
                            <TableHead className="text-right">Disponível</TableHead>
                            <TableHead className="w-[120px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">Carregando...</TableCell></TableRow>
                        ) : cards?.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhum cartão cadastrado.</TableCell></TableRow>
                        ) : (
                            cards?.map((card: any) => {
                                const available = card.credit_limit - card.current_balance; // Balance is strictly positive usage? Or debt? Backend says INCOME reduces balance. Triggers: EXPENSE +100. So balance=100 (debt). Available = Limit - Balance.
                                return (
                                    <TableRow key={card.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {resolveLogoPath(card.logo) ? (
                                                    <img src={resolveLogoPath(card.logo)!} alt="" className="h-8 w-8 rounded object-contain bg-muted" />
                                                ) : (
                                                    <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                                                )}
                                                {resolveBrandAsset(card.brand) && (
                                                    <img src={resolveBrandAsset(card.brand)!} alt={card.brand ?? ""} className="h-6 w-6 object-contain" />
                                                )}
                                                <span>{card.name}</span>
                                                {card.card_number && <span className="text-xs text-muted-foreground">•••• {card.card_number}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>Dia {card.due_day}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(card.credit_limit)}</TableCell>
                                        <TableCell className="text-right font-medium text-red-600">{formatCurrency(card.current_balance)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(available)}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" title="Pagar Fatura" onClick={() => openPayBill(card)}>
                                                    <DollarSign className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(card)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                                    if (confirm("Tem certeza?")) deleteMutation.mutate(card.id)
                                                }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
