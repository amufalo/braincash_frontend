import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Inbox,
  Calendar,
  CreditCard,
  Wallet,
  PiggyBank,
  Users,
  Tags,
  StickyNote,
  Sparkles,
  TrendingUp,
  Settings,
  Building2,
  Store,
} from "lucide-react";

export type SidebarSubItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: number;
};

export type SidebarItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: SidebarSubItem[];
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

export type SidebarNavData = {
  navMain: SidebarSection[];
  navSecondary: { title: string; url: string; icon: LucideIcon }[];
};

export interface SidebarNavOptions {
  preLancamentosCount?: number;
  isTenantAdmin?: boolean;
}

export function createSidebarNavData(options: SidebarNavOptions = {}): SidebarNavData {
  const { preLancamentosCount = 0, isTenantAdmin = false } = options;

  return {
    navMain: [
      {
        title: "Gestão Financeira",
        items: [
          {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
          },
          {
            title: "Lançamentos",
            url: "/transactions",
            icon: ArrowLeftRight,
            items: [
              {
                title: "Pré-Lançamentos",
                url: "/pre-transactions",
                icon: Inbox,
                badge: preLancamentosCount > 0 ? preLancamentosCount : undefined,
              },
            ],
          },
          { title: "Calendário", url: "/calendar", icon: Calendar },
          { title: "Cartões", url: "/cards", icon: CreditCard },
          { title: "Contas", url: "/accounts", icon: Wallet },
          { title: "Orçamentos", url: "/budgets", icon: PiggyBank },
        ],
      },
      {
        title: "Organização",
        items: [
          { title: "Categorias", url: "/categories", icon: Tags },
          { title: "Anotações", url: "/notes", icon: StickyNote },
        ],
      },
      {
        title: "Análise",
        items: [
          { title: "Insights", url: "/insights", icon: Sparkles },
          { title: "Tendências", url: "/reports/trends", icon: TrendingUp },
          { title: "Top Estabelecimentos", url: "/top-establishments", icon: Store },
        ],
      },
    ],
    navSecondary: [
      { title: "Ajustes", url: "/settings", icon: Settings },
      ...(isTenantAdmin
        ? [
            {
              title: "Usuários",
              url: "/users",
              icon: Users,
            } as const,
          ]
        : []),
    ],
  };
}

/** Item para admin (tenants) - usado no footer do sidebar */
export const adminNavItem = {
  title: "Tenants",
  url: "/admin",
  icon: Building2,
};
