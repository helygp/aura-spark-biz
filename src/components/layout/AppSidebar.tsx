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
      { icon: ShoppingCart, label: "Comanda", path: "/comanda" },
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

export function AppSidebar() {
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
    <aside className="hidden md:flex flex-col h-screen sticky top-0 w-[248px] bg-background border-r border-border px-[18px] py-[26px]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-1 mb-8">
        <div className="relative w-[34px] h-[34px] rounded-[10px] bg-tx1 flex items-center justify-center">
          <span className="block w-[14px] h-[14px] rounded-full border-2 border-primary" />
        </div>
        <div>
          <h1 className="text-tx1 font-semibold text-[17px] leading-none tracking-tight">
            Aura<span className="text-primary">.</span>
          </h1>
          <p className="text-tx4 text-[10px] mt-1 tracking-[0.18em] uppercase">
            Services Pro
          </p>
        </div>
      </div>

      {/* Groups */}
      <nav className="flex-1 overflow-y-auto space-y-6">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="px-2 mb-2 text-[10px] tracking-[0.12em] uppercase text-tx4 font-medium">
              {g.title}
            </div>
            <ul className="space-y-1">
              {g.items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "group flex items-center gap-3 px-3 h-10 rounded-[10px] text-[13.5px] font-medium transition-colors",
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
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
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
      <div className="mt-6 flex items-center gap-3 p-3 rounded-[14px] bg-card border border-border">
        <div className="w-9 h-9 rounded-[10px] bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-tx1 truncate">
            {business?.name || "Meu negócio"}
          </p>
          <p className="text-[11px] text-tx4 truncate">
            {profile?.full_name || "Administrador"}
          </p>
        </div>
      </div>
    </aside>
  );
}
