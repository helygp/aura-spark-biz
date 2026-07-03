import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ShoppingCart,
  Scissors,
  BarChart3,
  MessageSquare,
  Bot,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";

type Item = { icon: typeof LayoutDashboard; label: string; path: string; badge?: boolean };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Menu",
    items: [
      { icon: LayoutDashboard, label: "Painel", path: "/dashboard" },
      { icon: Calendar, label: "Agenda", path: "/agenda" },
      { icon: Users, label: "Clientes", path: "/clientes" },
      { icon: Scissors, label: "Serviços", path: "/servicos" },
      { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { icon: MessageSquare, label: "Marketing", path: "/marketing" },
      { icon: Bot, label: "Agentes IA", path: "/agentes", badge: true },
      { icon: Settings, label: "Configurações", path: "/configuracoes" },
    ],
  },
];

interface AppSidebarProps {
  collapsed?: boolean;
}

export function AppSidebar({ collapsed = false }: AppSidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { business } = useBusiness();

  const initials = (profile?.full_name || business?.name || "AU")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-background border-r border-border py-[26px] transition-all duration-300",
        collapsed ? "w-[72px] px-2 items-center" : "w-[248px] px-[18px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center mb-8", collapsed ? "justify-center px-0" : "gap-3 px-1")}>
        <div className="relative w-[34px] h-[34px] rounded-[10px] bg-tx1 flex items-center justify-center flex-shrink-0">
          <span className="block w-[14px] h-[14px] rounded-full border-2 border-primary" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-tx1 font-semibold text-[17px] leading-none tracking-tight">
              Aura<span className="text-primary">.</span>
            </h1>
            <p className="text-tx4 text-[10px] mt-1 tracking-[0.18em] uppercase">
              Services Pro
            </p>
          </div>
        )}
      </div>

      {/* Groups */}
      <nav className="flex-1 overflow-y-auto space-y-6 w-full">
        {groups.map((g) => (
          <div key={g.title}>
            {!collapsed && (
              <div className="px-2 mb-2 text-[10px] tracking-[0.12em] uppercase text-tx4 font-medium">
                {g.title}
              </div>
            )}
            <ul className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
              {g.items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      title={item.label}
                      className={cn(
                        "group flex items-center rounded-[10px] text-[13.5px] font-medium transition-colors",
                        collapsed
                          ? "justify-center w-10 h-10 mx-auto"
                          : "gap-3 px-3 h-10",
                        active
                          ? "bg-tx1 text-background"
                          : "text-tx3 hover:bg-line2 hover:text-tx1",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-[18px] h-[18px] flex-shrink-0",
                          active ? "opacity-100" : "opacity-80",
                        )}
                        strokeWidth={1.8}
                      />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-70" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div
        className={cn(
          "mt-6 flex items-center rounded-[14px] bg-card border border-border",
          collapsed ? "justify-center p-2 w-10 h-10 mx-auto" : "gap-3 p-3"
        )}
      >
        <div
          className={cn(
            "rounded-[10px] bg-primary/15 text-primary flex items-center justify-center font-semibold flex-shrink-0",
            collapsed ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm"
          )}
        >
          {initials}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-tx1 truncate">
              {business?.name || "Meu negócio"}
            </p>
            <p className="text-[11px] text-tx4 truncate">
              {profile?.full_name || "Administrador"}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
