import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Scissors,
  ShoppingBag,
  Receipt,
  Check
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock data
const services = [
  { id: 1, name: "Corte Masculino", price: 45, duration: 30 },
  { id: 2, name: "Corte + Barba", price: 70, duration: 60 },
  { id: 3, name: "Barba", price: 35, duration: 30 },
  { id: 4, name: "Corte Degradê", price: 55, duration: 45 },
  { id: 5, name: "Hidratação", price: 40, duration: 30 },
  { id: 6, name: "Coloração", price: 120, duration: 90 },
];

const products = [
  { id: 1, name: "Pomada Modeladora", price: 45, stock: 12 },
  { id: 2, name: "Óleo para Barba", price: 55, stock: 8 },
  { id: 3, name: "Shampoo Anticaspa", price: 38, stock: 15 },
  { id: 4, name: "Cera Capilar", price: 42, stock: 6 },
  { id: 5, name: "Pós-Barba", price: 35, stock: 10 },
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: "service" | "product";
}

export default function ComandaPage() {
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, name: "Corte + Barba", price: 70, quantity: 1, type: "service" },
    { id: 1, name: "Pomada Modeladora", price: 45, quantity: 1, type: "product" },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [selectedClient] = useState("João Silva");
  const [selectedProfessional] = useState("Carlos");

  const addToCart = (item: { id: number; name: string; price: number }, type: "service" | "product") => {
    const existingItem = cart.find(c => c.id === item.id && c.type === type);
    if (existingItem) {
      setCart(cart.map(c => 
        c.id === item.id && c.type === type 
          ? { ...c, quantity: c.quantity + 1 } 
          : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, type }]);
    }
  };

  const updateQuantity = (id: number, type: "service" | "product", delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id && item.type === type) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: number, type: "service" | "product") => {
    setCart(cart.filter(item => !(item.id === id && item.type === type)));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const commission = subtotal * 0.4; // 40% commission

  const filteredItems = activeTab === "services" 
    ? services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AppLayout title="Comanda" subtitle="Registre vendas e serviços">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Items Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Client & Professional Info */}
          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium text-foreground">{selectedClient}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Profissional</p>
                    <p className="font-medium text-foreground">{selectedProfessional}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Alterar
                </Button>
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
                      activeTab === "services" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveTab("services")}
                  >
                    <Scissors className="w-4 h-4" />
                    Serviços
                  </button>
                  <button
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2",
                      activeTab === "products" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item, activeTab === "services" ? "service" : "product")}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === "services" 
                          ? `${(item as typeof services[0]).duration} min`
                          : `${(item as typeof products[0]).stock} em estoque`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">
                        R$ {item.price}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Adicione itens à comanda
                  </p>
                ) : (
                  cart.map((item, index) => (
                    <div 
                      key={`${item.type}-${item.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {item.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          R$ {item.price * item.quantity}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => updateQuantity(item.id, item.type, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-5 text-center text-sm">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => updateQuantity(item.id, item.type, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => removeFromCart(item.id, item.type)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              {cart.length > 0 && (
                <>
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Comissão ({selectedProfessional})</span>
                      <span className="text-success">R$ {commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">R$ {subtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Forma de Pagamento</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                        <CreditCard className="w-5 h-5 mb-1" />
                        <span className="text-xs">Cartão</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                        <Banknote className="w-5 h-5 mb-1" />
                        <span className="text-xs">Dinheiro</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                        <QrCode className="w-5 h-5 mb-1" />
                        <span className="text-xs">Pix</span>
                      </Button>
                    </div>
                  </div>

                  <Button variant="gradient" size="lg" className="w-full">
                    <Check className="w-4 h-4 mr-2" />
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
