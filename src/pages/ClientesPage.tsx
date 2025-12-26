import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  Calendar,
  MessageSquare,
  Star,
  Filter,
  Download
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock data
const clients = [
  { 
    id: 1, 
    name: "João Silva", 
    phone: "(11) 99999-1234", 
    email: "joao@email.com",
    lastVisit: "2024-12-20",
    totalVisits: 24,
    totalSpent: 2450,
    status: "active",
    tags: ["VIP", "Assinante"],
  },
  { 
    id: 2, 
    name: "Pedro Santos", 
    phone: "(11) 99999-5678", 
    email: "pedro@email.com",
    lastVisit: "2024-12-18",
    totalVisits: 12,
    totalSpent: 980,
    status: "active",
    tags: [],
  },
  { 
    id: 3, 
    name: "Maria Lima", 
    phone: "(11) 99999-9012", 
    email: "maria@email.com",
    lastVisit: "2024-11-05",
    totalVisits: 8,
    totalSpent: 1200,
    status: "inactive",
    tags: ["Promoções"],
  },
  { 
    id: 4, 
    name: "Lucas Oliveira", 
    phone: "(11) 99999-3456", 
    email: "lucas@email.com",
    lastVisit: "2024-12-24",
    totalVisits: 36,
    totalSpent: 4200,
    status: "active",
    tags: ["VIP"],
  },
  { 
    id: 5, 
    name: "Fernanda Costa", 
    phone: "(11) 99999-7890", 
    email: "fernanda@email.com",
    lastVisit: "2024-12-22",
    totalVisits: 18,
    totalSpent: 2800,
    status: "active",
    tags: ["Assinante"],
  },
  { 
    id: 6, 
    name: "Bruno Almeida", 
    phone: "(11) 99999-2345", 
    email: "bruno@email.com",
    lastVisit: "2024-10-15",
    totalVisits: 5,
    totalSpent: 350,
    status: "inactive",
    tags: [],
  },
];

const statusColors: Record<string, string> = {
  active: "bg-success",
  inactive: "bg-muted-foreground",
};

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getDaysSinceLastVisit = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <AppLayout title="Clientes" subtitle={`${clients.length} clientes cadastrados`}>
      <div className="space-y-4 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold text-foreground">{clients.length}</p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Clientes Ativos</p>
              <p className="text-2xl font-bold text-success">{clients.filter(c => c.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Sem Retorno (+45 dias)</p>
              <p className="text-2xl font-bold text-warning">{clients.filter(c => getDaysSinceLastVisit(c.lastVisit) > 45).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === null ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setStatusFilter(null)}
              >
                Todos
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === "active" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setStatusFilter("active")}
              >
                Ativos
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === "inactive" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setStatusFilter("inactive")}
              >
                Inativos
              </button>
            </div>

            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>

            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Clients List */}
        <Card variant="elevated">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Contato</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Última Visita</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Visitas</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Total Gasto</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tags</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client, index) => {
                    const daysSince = getDaysSinceLastVisit(client.lastVisit);
                    return (
                      <tr 
                        key={client.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {client.name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <span className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                                statusColors[client.status]
                              )} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{client.name}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{client.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="space-y-1">
                            <p className="text-sm text-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {client.phone}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{formatDate(client.lastVisit)}</span>
                            {daysSince > 45 && (
                              <Badge variant="warning" className="text-[10px]">+{daysSince}d</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="text-sm text-foreground">{client.totalVisits}</span>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-sm font-medium text-foreground">
                            R$ {client.totalSpent.toLocaleString("pt-BR")}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {client.tags.map((tag) => (
                              <Badge key={tag} variant={tag === "VIP" ? "accent" : "muted"} className="text-[10px]">
                                {tag === "VIP" && <Star className="w-2.5 h-2.5 mr-0.5" />}
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" title="WhatsApp">
                              <MessageSquare className="w-4 h-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" title="Agendar">
                              <Calendar className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
