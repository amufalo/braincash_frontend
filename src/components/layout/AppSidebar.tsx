import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createSidebarNavData, adminNavItem } from '@/lib/sidebar-nav';
import { useState } from 'react';

interface AppSidebarProps {
  onNavigate?: () => void;
  preLancamentosCount?: number;
}

function isActive(pathname: string, url: string) {
  const n = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  const u = url.endsWith('/') && url !== '/' ? url.slice(0, -1) : url;
  return n === u || n.startsWith(`${u}/`);
}

export function AppSidebar({ onNavigate, preLancamentosCount = 0 }: AppSidebarProps) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const isTenantAdmin = !!user && (user.role === 'ADMIN' || user.is_superuser);
  const navigation = createSidebarNavData({ preLancamentosCount, isTenantAdmin });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <span className="text-xl font-bold text-sidebar-primary">Brain Cash</span>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-4">
        {navigation.navMain.map((section) => (
          <div key={section.title}>
            <div className="mb-1.5 px-3 text-xs font-medium text-muted-foreground">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const hasSub = item.items && item.items.length > 0;
                const isItemActive = isActive(pathname, item.url);
                const isSubOpen = expanded[item.title] ?? (isItemActive || (item.items?.some((s) => isActive(pathname, s.url)) ?? false));

                return (
                  <div key={item.url}>
                    <div className="flex items-center">
                      {hasSub ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.title)}
                          className="flex w-6 shrink-0 items-center justify-center rounded p-0 text-muted-foreground hover:text-foreground"
                          aria-expanded={isSubOpen}
                        >
                          <ChevronRight
                            className={cn('h-4 w-4 transition-transform', isSubOpen && 'rotate-90')}
                          />
                        </button>
                      ) : (
                        <span className="w-6 shrink-0" />
                      )}
                      <Link
                        to={item.url}
                        onClick={onNavigate}
                        className={cn(
                          'flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isItemActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.title}
                      </Link>
                    </div>
                    {hasSub && isSubOpen && (
                      <div className="ml-6 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                        {item.items!.map((sub) => {
                          const SubIcon = sub.icon;
                          const subActive = isActive(pathname, sub.url);
                          return (
                            <Link
                              key={sub.url}
                              to={sub.url}
                              onClick={onNavigate}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                subActive
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              )}
                            >
                              {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                              <span className="flex-1">{sub.title}</span>
                              {sub.badge != null && (
                                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                                  {sub.badge}
                                </Badge>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-2">
          <div className="mb-1.5 px-3 text-xs font-medium text-muted-foreground">Sistema</div>
          <div className="space-y-0.5">
            {navigation.navSecondary.map((item) => {
              const active = isActive(pathname, item.url);
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
            {user?.is_superuser && (
              <Link
                to={adminNavItem.url}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(pathname, adminNavItem.url)
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <adminNavItem.icon className="h-4 w-4" />
                {adminNavItem.title}
              </Link>
            )}
          </div>
        </div>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
