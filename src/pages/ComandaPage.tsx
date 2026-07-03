import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Scissors,
  ShoppingBag,
  Receipt,
  Check,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/hooks/useBusiness";
import { useServices } from "@/hooks/useServices";
import { useProducts } from "@/hooks/useProducts";
import { useClients } from "@/hooks/useClients";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useSales } from "@/hooks/useSales";

interface CartItem {
  item_id: string;
  item_type: "service" | "product";
  name: string;
  price: number;
  quantity: number;
}

type PaymentMethod = "card" | "cash" | "pix";

const NO_CLIENT = "__none__";

export default function ComandaPage() {
  const { business, isLoading: businessLoading } = useBusiness();
  const { services, isLoading: servicesLoading } = useServices(business?.id);
  const { products, isLoading: productsLoading } = useProducts(business?.id);
  const { clients } = useClients();
  const { professionals } = useProfessionals();
  const { createSale, commissionPct } = useSales();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [clientId, setClientId] = useState<string>(NO_CLIENT);
  const [professionalId, setProfessionalId] = useState<string>("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");

  const activeServices = services.filter((s) => s.is_active);
  const activeProducts = products.filter((p) => p.is_active);

  const filteredItems =
    activeTab === "services"
      ? activeServices.filter((s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : activeProducts.filter((p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

  const addToCart = (item: { id: string; name: string; price: number }, type: "service" | "product") => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item_id === item.id && c.item_type === type);
      if (existing) {
        return prev.map((c) =>
          c.item_id === item.id && c.item_type === type
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [
        ...prev,
        { item_id: item.id, item_type: type, name: item.name, price: Number(item.price), quantity: 1 },
      ];
    });
  };

  const updateQuantity = (id: string, type: "service" | "product", delta: number) => {
    setCart((prev) =>
      prev
        .map((it) =>
          it.item_id === id && it.item_type === type
            ? { ...it, quantity: it.quantity + delta }
            : it
        )
        .filter((it) => it.quantity > 0)
    );
  };

  const removeFromCart = (id: string, type: "service" | "product") => {
    setCart((prev) => prev.filter((it) => !(it.item_id === id && it.item_type === type)));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const commission = subtotal * (commissionPct / 100);

  const selectedProfessional = professionals.find((p) => p.id === professionalId);

  const handleFinalize = () => {
    if (!professionalId || cart.length === 0) return;
    createSale.mutate(
      {
        client_id: clientId === NO_CLIENT ? null : clientId,
        professional_id: professionalId,
        items: cart,
        payment_method: payment,
      },
      {
        onSuccess: () => {
          setCart([]);
          setClientId(NO_CLIENT);
          setProfessionalId("");
          setPayment("cash");
        },
      }
    );
  };

  if (businessLoading || servicesLoading || productsLoading) {
    return (
      <AppLayout title="Comanda" subtitle="Registre vendas e serviços">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const canFinalize = cart.length > 0 && !!professionalId && !createSale.isPending;

  return (
    <AppLayout title="Comanda" subtitle="Registre vendas e serviços">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Items Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Client & Professional selectors */}
          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cliente</label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CLIENT}>Sem cliente</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Profissional <span className="text-destructive">*</span>
                  </label>
                  <Select value={professionalId} onValueChange={setProfessionalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs & Search */}
          <Card variant="elevated">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex rounded-lg border border-input overflow-hidden">
                  <button
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2",
                      activeTab === "services"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveTab("services")}
                  >
                    <Scissors className="w-4 h-4" />
                    Serviços
                  </button>
                  <button
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2",
                      activeTab === "products"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveTab("products")}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Produtos
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-9 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  {activeTab === "services"
                    ? "Nenhum serviço cadastrado"
                    : "Nenhum produto cadastrado"}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredItems.map((item, index) => {
                    const isService = activeTab === "services";
                    return (
                      <button
                        key={item.id}
                        onClick={() =>
                          addToCart(
                            { id: item.id, name: item.name, price: Number(item.price) },
                            isService ? "service" : "product"
                          )
                        }
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {isService
                              ? `${(item as any).duration_minutes} min`
                              : `${(item as any).stock_quantity} em estoque`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">
                            R$ {Number(item.price).toFixed(2)}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart / Order Summary */}
        <div className="space-y-4">
          <Card variant="elevated" className="sticky top-20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Adicione itens à comanda
                  </p>
                ) : (
                  cart.map((item, index) => (
                    <div
                      key={`${item.item_type}-${item.item_id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => updateQuantity(item.item_id, item.item_type, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-5 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => updateQuantity(item.item_id, item.item_type, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeFromCart(item.item_id, item.item_type)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <>
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Comissão{selectedProfessional ? ` (${selectedProfessional.name})` : ""}
                      </span>
                      <span className="text-success">R$ {commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">R$ {subtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Forma de Pagamento</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={payment === "card" ? "default" : "outline"}
                        size="sm"
                        className="flex-col h-auto py-3"
                        onClick={() => setPayment("card")}
                      >
                        <CreditCard className="w-5 h-5 mb-1" />
                        <span className="text-xs">Cartão</span>
                      </Button>
                      <Button
                        variant={payment === "cash" ? "default" : "outline"}
                        size="sm"
                        className="flex-col h-auto py-3"
                        onClick={() => setPayment("cash")}
                      >
                        <Banknote className="w-5 h-5 mb-1" />
                        <span className="text-xs">Dinheiro</span>
                      </Button>
                      <Button
                        variant={payment === "pix" ? "default" : "outline"}
                        size="sm"
                        className="flex-col h-auto py-3"
                        onClick={() => setPayment("pix")}
                      >
                        <QrCode className="w-5 h-5 mb-1" />
                        <span className="text-xs">Pix</span>
                      </Button>
                    </div>
                  </div>

                  {!professionalId && (
                    <p className="text-xs text-warning text-center">
                      Selecione um profissional para finalizar
                    </p>
                  )}

                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    disabled={!canFinalize}
                    onClick={handleFinalize}
                  >
                    {createSale.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Finalizar Comanda
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}