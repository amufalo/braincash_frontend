import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Plus, Trash2, Users, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export default function Tenants() {
    const [isOpen, setIsOpen] = useState(false)
    const [isCreate, setIsCreate] = useState(false)
    const [editingTenant, setEditingTenant] = useState<any>(null)
    const [deleteTenant, setDeleteTenant] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        email: "",
        is_active: true,
    })

    const queryClient = useQueryClient()

    const { data: tenants, isLoading } = useQuery({
        queryKey: ["admin-tenants"],
        queryFn: async () => {
            const res = await api.get("/tenants/")
            return res.data
        },
    })

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => await api.post("/tenants/", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-tenants"] })
            setIsOpen(false)
            setIsCreate(false)
            resetForm()
            toast.success("Tenant criado!")
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail || "Erro ao criar tenant"),
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) =>
            await api.put(`/tenants/${editingTenant.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-tenants"] })
            setIsOpen(false)
            setEditingTenant(null)
            resetForm()
            toast.success("Tenant atualizado!")
        },
        onError: () => toast.error("Erro ao atualizar tenant"),
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => await api.delete(`/tenants/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-tenants"] })
            setDeleteTenant(null)
            toast.success("Tenant desativado.")
        },
        onError: () => toast.error("Erro ao desativar tenant"),
    })

    const toggleActiveMutation = useMutation({
        mutationFn: async ({
            id,
            is_active,
        }: {
            id: number
            is_active: boolean
        }) => await api.put(`/tenants/${id}`, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-tenants"] })
            toast.success("Status atualizado!")
        },
        onError: () => toast.error("Erro ao atualizar status"),
    })

    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            email: "",
            is_active: true,
        })
    }

    const handleCreate = () => {
        setIsCreate(true)
        setEditingTenant(null)
        resetForm()
        setIsOpen(true)
    }

    const handleEdit = (tenant: any) => {
        setEditingTenant(tenant)
        setIsCreate(false)
        setFormData({
            name: tenant.name,
            slug: tenant.slug,
            email: tenant.email,
            is_active: tenant.is_active,
        })
        setIsOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isCreate) {
            createMutation.mutate(formData)
        } else {
            updateMutation.mutate(formData)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">
                    Administração de Tenants
                </h2>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo tenant
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center h-24"
                                >
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenants?.map((t: any) => (
                                <TableRow key={t.id}>
                                    <TableCell>{t.id}</TableCell>
                                    <TableCell className="font-medium">
                                        {t.name}
                                    </TableCell>
                                    <TableCell>{t.slug}</TableCell>
                                    <TableCell>{t.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                t.is_active
                                                    ? "default"
                                                    : "destructive"
                                            }
                                        >
                                            {t.is_active ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    to={`/admin/tenants/${t.id}/users`}
                                                >
                                                    <Users className="h-4 w-4 mr-1" />
                                                    Usuários
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(t)}
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    toggleActiveMutation.mutate(
                                                        {
                                                            id: t.id,
                                                            is_active:
                                                                !t.is_active,
                                                        }
                                                    )
                                                }
                                                title={
                                                    t.is_active
                                                        ? "Desativar"
                                                        : "Ativar"
                                                }
                                            >
                                                {t.is_active ? (
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                )}
                                            </Button>
                                            {t.is_active && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setDeleteTenant(t)
                                                    }
                                                    title="Desativar tenant"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isCreate ? "Novo Tenant" : "Editar Tenant"}
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-4 py-4"
                    >
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Slug</Label>
                            <Input
                                value={formData.slug}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        slug: e.target.value,
                                    })
                                }
                                required
                                disabled={!isCreate}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked: boolean) =>
                                    setFormData({
                                        ...formData,
                                        is_active: checked,
                                    })
                                }
                            />
                            <Label>Ativo</Label>
                        </div>
                        <Button
                            type="submit"
                            disabled={
                                isCreate
                                    ? createMutation.isPending
                                    : updateMutation.isPending
                            }
                        >
                            {isCreate ? "Criar" : "Salvar"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!deleteTenant}
                onOpenChange={(open) => !open && setDeleteTenant(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Desativar tenant?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        O tenant &quot;{deleteTenant?.name}&quot; será
                        desativado. Os usuários não poderão mais fazer login.
                        Esta ação não remove dados.
                    </p>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTenant(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                deleteTenant &&
                                deleteMutation.mutate(deleteTenant.id)
                            }
                            disabled={deleteMutation.isPending}
                        >
                            Desativar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
