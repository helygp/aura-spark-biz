import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Scissors,
  MessageSquare,
  Bot,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Item = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  badge?: boolean;
};

const primary: Item[] = [
  { icon: LayoutDashboard, label: "Painel", path: "/dashboard" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: Users, label: "Clientes", path: "/clientes" },
];

const moreItems: Item[] = [
  { icon: Scissors, label: "Serviços", path: "/servicos" },
  { icon: MessageSquare, label: "Marketing", path: "/marketing" },
  { icon: Bot, label: "Agentes IA", path: "/agentes", badge: true },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const moreActive = moreItems.some((i) => pathname === i.path);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <ul className="flex items-stretch justify-around h-16">
        {primary.map((item) => {
          const active = pathname === item.path;
          return (
            <li key={item.path} className="flex-1">
              <Link
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-full text-[10.5px] font-medium transition-colors",
                  active ? "text-primary" : "text-tx4 hover:text-tx1",
                )}
              >
                <item.icon
                  className="w-[22px] h-[22px]"
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className="truncate max-w-[64px]">{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-full w-full text-[10.5px] font-medium transition-colors relative",
                  moreActive ? "text-primary" : "text-tx4 hover:text-tx1",
                )}
              >
                <MoreHorizontal
                  className="w-[22px] h-[22px]"
                  strokeWidth={moreActive ? 2.2 : 1.8}
                />
                <span>Mais</span>
                {moreItems.some((i) => i.badge) && (
                  <span className="absolute top-2 right-[calc(50%-14px)] flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-70" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+16px)]"
            >
              <SheetHeader className="text-left">
                <SheetTitle>Mais opções</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 space-y-1">
                {moreItems.map((item) => {
                  const active = pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 h-12 rounded-[10px] text-sm font-medium transition-colors",
                          active
                            ? "bg-tx1 text-background"
                            : "text-tx2 hover:bg-line2 hover:text-tx1",
                        )}
                      >
                        <item.icon className="w-5 h-5" strokeWidth={1.8} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-success opacity-70" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}