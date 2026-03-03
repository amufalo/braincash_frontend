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
import { Plus, Pencil, Trash2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, cn } from "@/lib/utils"
import { resolveLogoPath, normalizeLogo } from "@/lib/logo"
import { LogoPickerTrigger, LogoPickerDialog } from "@/components/logo-picker"
import { useLogoSelection } from "@/hooks/use-logo-selection"

export default function Accounts() {
    const [isOpen, setIsOpen] = useState(false)
    const [logoDialogOpen, setLogoDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        bank_name: "",
        logo: "",
        account_number: "",
        account_type: "CHECKING",
        initial_balance: "0",
    })

    const queryClient = useQueryClient()

    const { data: accounts, isLoading } = useQuery({
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

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.post('/accounts/', data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            setIsOpen(false)
            toast.success("Conta criada com sucesso!")
            resetForm()
        },
        onError: () => toast.error("Erro ao criar conta")
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.put(`/accounts/${editingId}`, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            setIsOpen(false)
            setEditingId(null)
            toast.success("Conta atualizada com sucesso!")
            resetForm()
        },
        onError: () => toast.error("Erro ao atualizar conta")
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return await api.delete(`/accounts/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            toast.success("Conta removida com sucesso!")
        },
        onError: () => toast.error("Erro ao remover conta")
    })

    const resetForm = () => {
        setFormData({
            name: "",
            bank_name: "",
            logo: logoOptions[0] ?? "",
            account_number: "",
            account_type: "CHECKING",
            initial_balance: "0",
        })
        setEditingId(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            ...formData,
            logo: formData.logo?.trim() || null,
            initial_balance: parseFloat(formData.initial_balance),
        }

        if (editingId) {
            updateMutation.mutate(payload)
        } else {
            createMutation.mutate(payload)
        }
    }

    const handleEdit = (account: any) => {
        setEditingId(account.id)
        const fallbackLogo = logoOptions[0] ?? ""
        const selectedLogo = normalizeLogo(account.logo) || fallbackLogo
        setFormData({
            name: account.name,
            bank_name: account.bank_name ?? "",
            logo: selectedLogo,
            account_number: account.account_number ?? "",
            account_type: account.account_type,
            initial_balance: account.initial_balance.toString(),
        })
        setIsOpen(true)
    }

    const handleLogoSelection = useLogoSelection({
        mode: editingId ? "update" : "create",
        currentLogo: formData.logo,
        currentName: formData.name,
        onUpdate: (updates) => {
            setFormData((prev) => ({ ...prev, ...updates }))
            requestAnimationFrame(() => setLogoDialogOpen(false))
        },
    })

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            if (logoDialogOpen) return
            setLogoDialogOpen(false)
            resetForm()
            setIsOpen(false)
            return
        }
        if (!editingId) {
            setFormData({
                name: "",
                bank_name: "",
                logo: logoOptions[0] ?? "",
                account_number: "",
                account_type: "CHECKING",
                initial_balance: "0",
            })
        }
        setIsOpen(open)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Contas Bancárias</h2>
                <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Nova Conta</Button>
                    </DialogTrigger>
                    <DialogContent
                        onPointerDownOutside={(e) => { if (logoDialogOpen) e.preventDefault() }}
                        onInteractOutside={(e) => { if (logoDialogOpen) e.preventDefault() }}
                    >
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Editar Conta" : "Nova Conta"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <LogoPickerTrigger
                                    selectedLogo={formData.logo || null}
                                    disabled={logoOptions.length === 0}
                                    helperText="Clique para escolher o logo da instituição"
                                    placeholder="Selecionar logo"
                                    onOpen={() => { if (logoOptions.length > 0) setLogoDialogOpen(true) }}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome da Conta</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bank">Banco / Instituição</Label>
                                <Input
                                    id="bank"
                                    value={formData.bank_name}
                                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipo</Label>
                                <Select
                                    value={formData.account_type}
                                    onValueChange={(val) => setFormData({ ...formData, account_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CHECKING">Conta Corrente</SelectItem>
                                        <SelectItem value="SAVINGS">Poupança</SelectItem>
                                        <SelectItem value="INVESTMENT">Investimento</SelectItem>
                                        <SelectItem value="CASH">Dinheiro</SelectItem>
                                        <SelectItem value="OTHER">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {!editingId && (
                                <div className="grid gap-2">
                                    <Label htmlFor="balance">Saldo Inicial</Label>
                                    <Input
                                        id="balance"
                                        type="number"
                                        step="0.01"
                                        value={formData.initial_balance}
                                        onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingId ? "Salvar Alterações" : "Criar Conta"}
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
                    description="Selecione o logo que será usado para identificar esta conta."
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Banco</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Saldo Atual</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell>
                            </TableRow>
                        ) : accounts?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhuma conta cadastrada.</TableCell>
                            </TableRow>
                        ) : (
                            accounts?.map((account: any) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {resolveLogoPath(account.logo) ? (
                                                <img
                                                    src={resolveLogoPath(account.logo)!}
                                                    alt=""
                                                    className="h-8 w-8 rounded object-contain bg-muted"
                                                />
                                            ) : (
                                                <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                            <span>{account.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{account.bank_name ?? "—"}</TableCell>
                                    <TableCell>{account.account_type}</TableCell>
                                    <TableCell className={cn(
                                        "text-right font-medium",
                                        account.current_balance >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        {formatCurrency(account.current_balance)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                                if (confirm("Tem certeza? Transações associadas podem ser afetadas."))
                                                    deleteMutation.mutate(account.id)
                                            }}>
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
        </div>
    )
}
