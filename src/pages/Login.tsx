import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ThemeSelector } from '@/components/ThemeSelector';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const formSchema = z.object({
    email: z.string().email({
        message: "Email inválido.",
    }),
    password: z.string().min(1, {
        message: "A senha é obrigatória.",
    }),
});

export default function Login() {
    const { login } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', values.email);
            formData.append('password', values.password);

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { token, user, tenant } = response.data;
            const { access_token } = token;
            const userData = { ...user, name: user.full_name ?? user.name ?? user.email ?? '' };

            login(access_token, userData, tenant);
            toast.success("Login realizado com sucesso!");
            navigate('/');

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || "Erro ao realizar login";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className={cn(
                "flex min-h-screen flex-col items-center justify-center text-foreground",
                theme === "default" ? "login-page-gradient" : "bg-background"
            )}
        >
            <div className="absolute right-4 top-4">
                <ThemeSelector />
            </div>

            <div className="flex w-full max-w-[380px] px-4">
                <Card className="w-full">
                    <CardHeader className="flex flex-col items-center space-y-3 pb-4">
                        <img
                            src="/logo.png"
                            alt="Brain Cash"
                            className="h-16 w-auto object-contain"
                        />
                        <div className="space-y-1 text-center">
                            <CardTitle className="text-xl">Brain Cash</CardTitle>
                            <CardDescription>Entre na sua conta para continuar.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="seu@email.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Senha</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="******" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Entrando..." : "Entrar"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
