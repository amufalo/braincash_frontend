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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, List, Info } from "lucide-react"
import { CategoryIcon } from "@/components/categories/CategoryIcon"
import { toast } from "sonner"

interface DescriptionMapping {
    id: number
    description: string
    created_at: string
}

export default function Categories() {
    const [isOpen, setIsOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [descriptionsOpenForId, setDescriptionsOpenForId] = useState<number | null>(null)
    const [descriptionForCategories, setDescriptionForCategories] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: "EXPENSE",
        color: "#000000",
        icon: "",
    })

    const queryClient = useQueryClient()

    // Queries
    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories/')
            return res.data
        }
    })

    const { data: descriptionMappings = [] } = useQuery({
        queryKey: ['category-description-mappings', descriptionsOpenForId],
        queryFn: async () => {
            if (!descriptionsOpenForId) return []
            const res = await api.get<DescriptionMapping[]>(
                `/categories/${descriptionsOpenForId}/description-mappings`
            )
            return res.data
        },
        enabled: !!descriptionsOpenForId,
    })

    const { data: mappingsByDescription = [] } = useQuery({
        queryKey: ['mappings-by-description', descriptionForCategories],
        queryFn: async () => {
            if (!descriptionForCategories) return []
            const res = await api.get<
                { id: number; category_id: number; category_name: string }[]
            >(`/categories/by-description/mappings`, {
                params: { description: descriptionForCategories },
            })
            return res.data
        },
        enabled: !!descriptionForCategories,
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: any) => await api.post('/categories/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            setIsOpen(false)
            toast.success("Categoria criada com sucesso!")
            resetForm()
        },
        onError: () => toast.error("Erro ao criar categoria")
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) => await api.put(`/categories/${editingId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            setIsOpen(false)
            setEditingId(null)
            toast.success("Categoria atualizada!")
            resetForm()
        },
        onError: () => toast.error("Erro ao atualizar categoria")
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => await api.delete(`/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            toast.success("Categoria removida!")
        },
        onError: () => toast.error("Erro ao remover categoria")
    })

    const removeDescriptionMutation = useMutation({
        mutationFn: async ({
            categoryId,
            mappingId,
        }: {
            categoryId: number
            mappingId: number
        }) =>
            api.delete(
                `/categories/${categoryId}/description-mappings/${mappingId}`
            ),
        onSuccess: (_, { categoryId }) => {
            queryClient.invalidateQueries({
                queryKey: ['category-description-mappings', categoryId],
            })
            toast.success("Descrição removida do mapeamento")
        },
        onError: () => toast.error("Erro ao remover descrição"),
    })

    // Handlers
    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            type: "EXPENSE",
            color: "#000000",
            icon: "",
        })
        setEditingId(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingId) {
            updateMutation.mutate(formData)
        } else {
            createMutation.mutate(formData)
        }
    }

    const openEdit = (cat: any) => {
        setEditingId(cat.id)
        setFormData({
            name: cat.name,
            description: cat.description || "",
            type: cat.type,
            color: cat.color || "#000000",
            icon: cat.icon || "",
        })
        setIsOpen(true)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Categorias</h2>
                <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Nova Categoria</Button>
                        </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipo</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val })}
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
                                <Label htmlFor="color">Cor</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="color" type="color" className="w-12 h-10 p-1" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                                    <Input id="color-hex" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                                </div>
                            </div>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingId ? "Salvar" : "Criar"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cor</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descrições</TableHead>
                            <TableHead className="w-[120px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell></TableRow>
                        ) : categories?.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhuma categoria cadastrada.</TableCell></TableRow>
                        ) : (
                            categories?.map((cat: any) => (
                                <TableRow key={cat.id}>
                                    <TableCell>
                                        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: cat.color }}></div>
                                    </TableCell>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <CategoryIcon icon={cat.icon} color={cat.color} />
                                        {cat.name}
                                    </TableCell>
                                    <TableCell>
                                        <span className={cat.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                            {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDescriptionsOpenForId(cat.id)}
                                            title="Ver descrições relacionadas"
                                        >
                                            <List className="h-4 w-4 mr-1" />
                                            Descrições
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                                if (confirm("Tem certeza?")) deleteMutation.mutate(cat.id)
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

            {/* Dialog: descrições relacionadas à categoria */}
            <Dialog
                open={!!descriptionsOpenForId}
                onOpenChange={(open) => !open && setDescriptionsOpenForId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Descrições relacionadas
                            {descriptionsOpenForId &&
                                categories?.find((c: any) => c.id === descriptionsOpenForId) && (
                                    <span className="font-normal text-muted-foreground">
                                        {" "}
                                        –{" "}
                                        {
                                            categories.find(
                                                (c: any) => c.id === descriptionsOpenForId
                                            )?.name
                                        }
                                    </span>
                                )}
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Descrições de lançamentos que serão automaticamente categorizados aqui.
                    </p>
                    {descriptionsOpenForId && (
                        <div className="rounded-md border max-h-64 overflow-y-auto">
                            {descriptionMappings.length === 0 ? (
                                <p className="p-4 text-center text-muted-foreground text-sm">
                                    Nenhuma descrição relacionada. Ao gravar a categoria em um
                                    pré-lançamento, a descrição será vinculada aqui.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead className="w-[80px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {descriptionMappings.map((m: DescriptionMapping) => (
                                            <TableRow key={m.id}>
                                                <TableCell className="font-mono text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {m.description}
                                                        <Popover
                                                            onOpenChange={(open) =>
                                                                setDescriptionForCategories(
                                                                    open ? m.description : null
                                                                )
                                                            }
                                                        >
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    title="Ver todas as categorias desta descrição"
                                                                >
                                                                    <Info className="h-4 w-4" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80">
                                                                <p className="font-medium text-sm mb-2">
                                                                    Categorias relacionadas
                                                                </p>
                                                                {mappingsByDescription.length === 0 ? (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Carregando...
                                                                    </p>
                                                                ) : (
                                                                    <ul className="text-sm space-y-1">
                                                                        {mappingsByDescription.map(
                                                                            (x) => (
                                                                                <li
                                                                                    key={x.id}
                                                                                    className="flex items-center justify-between"
                                                                                >
                                                                                    {x.category_name}
                                                                                    {x.category_id ===
                                                                                        descriptionsOpenForId && (
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            (atual)
                                                                                        </span>
                                                                                    )}
                                                                                </li>
                                                                            )
                                                                        )}
                                                                    </ul>
                                                                )}
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={() =>
                                                            removeDescriptionMutation.mutate({
                                                                categoryId: descriptionsOpenForId!,
                                                                mappingId: m.id,
                                                            })
                                                        }
                                                        disabled={
                                                            removeDescriptionMutation.isPending
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
