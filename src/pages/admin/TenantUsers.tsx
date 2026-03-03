import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

const ROLES = [
    { value: "ADMIN", label: "Admin" },
    { value: "EDITOR", label: "Editor" },
    { value: "VIEWER", label: "Visualizador" },
] as const

export default function TenantUsers() {
    const { tenantId } = useParams<{ tenantId: string }>()
    const id = tenantId ? parseInt(tenantId, 10) : NaN
    const [isUserOpen, setIsUserOpen] = useState(false)
    const [isCreate, setIsCreate] = useState(true)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [deleteUser, setDeleteUser] = useState<any>(null)
    const [userForm, setUserForm] = useState({
        email: "",
        full_name: "",
        password: "",
        role: "VIEWER" as string,
        is_active: true,
    })

    const queryClient = useQueryClient()

    const { data: tenant, isLoading: tenantLoading } = useQuery({
        queryKey: ["admin-tenant", id],
        queryFn: async () => {
            const res = await api.get(`/tenants/${id}`)
            return res.data
        },
        enabled: Number.isInteger(id),
    })

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ["admin-tenant-users", id],
        queryFn: async () => {
            const res = await api.get(`/tenants/${id}/users`)
            return res.data
        },
        enabled: Number.isInteger(id),
    })

    const createUserMutation = useMutation({
        mutationFn: async (data: typeof userForm) =>
            await api.post(`/tenants/${id}/users`, {
                email: data.email,
                full_name: data.full_name || undefined,
                password: data.password,
                role: data.role,
                is_active: data.is_active,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-tenant-users", id] })
            setIsUserOpen(false)
            resetUserForm()
            toast.success("Usuário criado!")
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail || "Erro ao criar usuário"),
    })

    const updateUserMutation = useMutation({
        mutationFn: async ({
            userId,
            data,
        }: {
            userId: number
            data: Partial<typeof userForm>
        }) =>
            await api.put(`/tenants/${id}/users/${userId}`, {
                full_name: data.full_name,
                role: data.role,
                is_active: data.is_active,
                ...(data.password ? { password: data.password } : {}),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-tenant-users", id] })
            setIsUserOpen(false)
            setEditingUser(null)
            resetUserForm()
            toast.success("Usuário atualizado!")
        },
        onError: () => toast.error("Erro ao atualizar usuário"),
    })

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: number) =>
            await api.delete(`/tenants/${id}/users/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-tenant-users", id] })
            setDeleteUser(null)
            toast.success("Usuário desativado.")
        },
        onError: () => toast.error("Erro ao desativar usuário"),
    })

    const resetUserForm = () => {
        setUserForm({
            email: "",
            full_name: "",
            password: "",
            role: "VIEWER",
            is_active: true,
        })
    }

    const handleCreateUser = () => {
        setIsCreate(true)
        setEditingUser(null)
        resetUserForm()
        setIsUserOpen(true)
    }

    const handleEditUser = (user: any) => {
        setEditingUser(user)
        setIsCreate(false)
        setUserForm({
            email: user.email,
            full_name: user.full_name || "",
            password: "",
            role: user.role || "VIEWER",
            is_active: user.is_active ?? true,
        })
        setIsUserOpen(true)
    }

    const handleSubmitUser = (e: React.FormEvent) => {
        e.preventDefault()
        if (isCreate) {
            if (!userForm.password?.trim()) {
                toast.error("Senha é obrigatória para novo usuário.")
                return
            }
            createUserMutation.mutate(userForm)
        } else if (editingUser) {
            updateUserMutation.mutate({
                userId: editingUser.id,
                data: {
                    full_name: userForm.full_name,
                    role: userForm.role,
                    is_active: userForm.is_active,
                    ...(userForm.password ? { password: userForm.password } : {}),
                },
            })
        }
    }

    if (!Number.isInteger(id)) {
        return (
            <div className="flex flex-col gap-4">
                <p className="text-destructive">Tenant inválido.</p>
                <Button asChild variant="outline">
                    <Link to="/admin">Voltar</Link>
                </Button>
            </div>
        )
    }

    const isLoading = tenantLoading || usersLoading

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/admin">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Usuários do tenant
                    </h2>
                    <p className="text-muted-foreground">
                        {tenant ? tenant.name : "Carregando..."} ({tenant?.slug})
                    </p>
                </div>
                <Button onClick={handleCreateUser}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo usuário
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Função</TableHead>
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
                            users?.map((u: any) => (
                                <TableRow key={u.id}>
                                    <TableCell>{u.id}</TableCell>
                                    <TableCell className="font-medium">
                                        {u.full_name || "—"}
                                    </TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{u.role}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                u.is_active
                                                    ? "default"
                                                    : "destructive"
                                            }
                                        >
                                            {u.is_active ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditUser(u)}
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {u.is_active && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setDeleteUser(u)
                                                    }
                                                    title="Desativar usuário"
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

            <Dialog open={isUserOpen} onOpenChange={setIsUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isCreate ? "Novo usuário" : "Editar usuário"}
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={handleSubmitUser}
                        className="grid gap-4 py-4"
                    >
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={userForm.email}
                                onChange={(e) =>
                                    setUserForm({
                                        ...userForm,
                                        email: e.target.value,
                                    })
                                }
                                required
                                disabled={!isCreate}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Nome completo</Label>
                            <Input
                                value={userForm.full_name}
                                onChange={(e) =>
                                    setUserForm({
                                        ...userForm,
                                        full_name: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                Senha {!isCreate && "(deixe em branco para não alterar)"}
                            </Label>
                            <Input
                                type="password"
                                value={userForm.password}
                                onChange={(e) =>
                                    setUserForm({
                                        ...userForm,
                                        password: e.target.value,
                                    })
                                }
                                required={isCreate}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Função</Label>
                            <Select
                                value={userForm.role}
                                onValueChange={(value) =>
                                    setUserForm({ ...userForm, role: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => (
                                        <SelectItem
                                            key={r.value}
                                            value={r.value}
                                        >
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {!isCreate && (
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={userForm.is_active}
                                    onCheckedChange={(checked: boolean) =>
                                        setUserForm({
                                            ...userForm,
                                            is_active: checked,
                                        })
                                    }
                                />
                                <Label>Ativo</Label>
                            </div>
                        )}
                        <Button
                            type="submit"
                            disabled={
                                isCreate
                                    ? createUserMutation.isPending
                                    : updateUserMutation.isPending
                            }
                        >
                            {isCreate ? "Criar" : "Salvar"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!deleteUser}
                onOpenChange={(open) => !open && setDeleteUser(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Desativar usuário?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        O usuário &quot;{deleteUser?.full_name || deleteUser?.email}&quot; será
                        desativado e não poderá mais fazer login.
                    </p>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteUser(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                deleteUser &&
                                deleteUserMutation.mutate(deleteUser.id)
                            }
                            disabled={deleteUserMutation.isPending}
                        >
                            Desativar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
