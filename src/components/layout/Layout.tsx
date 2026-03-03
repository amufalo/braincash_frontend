import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeSelector } from '@/components/ThemeSelector';

export default function Layout() {
    const { user, tenant } = useAuth();
    const { data: preCount } = useQuery({
        queryKey: ['pre-transactions-count'],
        queryFn: async () => {
            const res = await api.get<{ count: number }>('/pre-transactions/count');
            return res.data.count;
        },
    });

    return (
        <div className="flex h-screen bg-background text-foreground">
            <AppSidebar preLancamentosCount={preCount ?? 0} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b px-6">
                    <h1 className="text-lg font-semibold">{tenant?.name}</h1>
                    <div className="flex items-center gap-2">
                        <ThemeSelector />
                        <span className="text-sm text-muted-foreground">Olá, {user?.name}</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
