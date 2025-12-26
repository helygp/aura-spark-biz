import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Target,
  Download
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Mock data
const revenueData = [
  { name: "Seg", value: 1200 },
  { name: "Ter", value: 1800 },
  { name: "Qua", value: 1400 },
  { name: "Qui", value: 2200 },
  { name: "Sex", value: 2800 },
  { name: "Sáb", value: 3200 },
  { name: "Dom", value: 800 },
];

const occupancyData = [
  { name: "08h", Carlos: 80, Ana: 60, Pedro: 40 },
  { name: "10h", Carlos: 100, Ana: 80, Pedro: 60 },
  { name: "12h", Carlos: 40, Ana: 40, Pedro: 20 },
  { name: "14h", Carlos: 80, Ana: 100, Pedro: 80 },
  { name: "16h", Carlos: 100, Ana: 80, Pedro: 100 },
  { name: "18h", Carlos: 60, Ana: 60, Pedro: 40 },
];

const professionals = [
  { name: "Carlos", revenue: 8500, clients: 145, avgTicket: 58.62, trend: "+12%" },
  { name: "Ana", revenue: 7200, clients: 98, avgTicket: 73.47, trend: "+8%" },
  { name: "Pedro", revenue: 5100, clients: 87, avgTicket: 58.62, trend: "+5%" },
];

export default function RelatoriosPage() {
  return (
    <AppLayout title="Relatórios" subtitle="Métricas e indicadores do seu negócio">
      <div className="space-y-6 animate-fade-in">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-lg border border-input overflow-hidden">
            <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground">
              Semana
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-background text-muted-foreground hover:text-foreground transition-colors">
              Mês
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-background text-muted-foreground hover:text-foreground transition-colors">
              Ano
            </button>
          </div>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento</p>
                  <p className="text-2xl font-bold text-foreground mt-1">R$ 20.800</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +15% vs semana anterior
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                  <p className="text-2xl font-bold text-foreground mt-1">78%</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +5% vs semana anterior
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold text-foreground mt-1">R$ 62</p>
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <TrendingDown className="w-3 h-3" />
                    -3% vs semana anterior
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Retorno</p>
                  <p className="text-2xl font-bold text-foreground mt-1">68%</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +8% vs semana anterior
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Faturamento Diário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value) => [`R$ ${value}`, "Faturamento"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(262, 83%, 58%)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy Chart */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Ocupação por Horário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value) => [`${value}%`, ""]}
                    />
                    <Bar dataKey="Carlos" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Ana" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pedro" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-sm text-muted-foreground">Carlos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-success" />
                  <span className="text-sm text-muted-foreground">Ana</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-info" />
                  <span className="text-sm text-muted-foreground">Pedro</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professionals Performance */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Desempenho por Profissional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Profissional</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Faturamento</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Atendimentos</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Ticket Médio</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Tendência</th>
                  </tr>
                </thead>
                <tbody>
                  {professionals.map((prof, index) => (
                    <tr 
                      key={prof.name}
                      className="border-b border-border hover:bg-muted/50 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">{prof.name[0]}</span>
                          </div>
                          <span className="font-medium text-foreground">{prof.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-foreground">
                        R$ {prof.revenue.toLocaleString("pt-BR")}
                      </td>
                      <td className="p-3 text-right text-foreground">{prof.clients}</td>
                      <td className="p-3 text-right text-foreground">
                        R$ {prof.avgTicket.toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-success flex items-center justify-end gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {prof.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
