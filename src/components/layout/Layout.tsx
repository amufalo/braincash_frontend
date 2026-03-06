import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
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
            {/* Sidebar: oculto no mobile, visível em md+ */}
            <aside className="hidden md:flex shrink-0">
                <AppSidebar preLancamentosCount={preCount ?? 0} />
            </aside>
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                <header className="flex h-14 md:h-16 items-center justify-between gap-2 border-b px-4 md:px-6 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <MobileNav />
                        <h1 className="text-base md:text-lg font-semibold truncate">{tenant?.name}</h1>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <ThemeSelector />
                        <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">Olá, {user?.name}</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
