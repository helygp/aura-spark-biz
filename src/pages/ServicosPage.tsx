import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Scissors,
  ShoppingBag,
  Edit,
  Trash2,
  Clock,
  Package,
  Loader2,
} from 'lucide-react';
import { useServices, Service } from '@/hooks/useServices';
import { useProducts, Product } from '@/hooks/useProducts';
import { useBusiness } from '@/hooks/useBusiness';
import { ServiceDialog } from '@/components/services/ServiceDialog';
import { ProductDialog } from '@/components/products/ProductDialog';
import { CreateBusinessDialog } from '@/components/onboarding/CreateBusinessDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ServicosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteService, setDeleteService] = useState<Service | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const { business, isLoading: businessLoading, createBusiness } = useBusiness();
  const { services, isLoading: servicesLoading, createService, updateService, deleteService: deleteServiceMutation } = useServices(business?.id);
  const { products, isLoading: productsLoading, createProduct, updateProduct, deleteProduct: deleteProductMutation } = useProducts(business?.id);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleServiceSubmit = (data: any) => {
    if (editingService) {
      updateService.mutate({ id: editingService.id, ...data }, {
        onSuccess: () => {
          setServiceDialogOpen(false);
          setEditingService(null);
        },
      });
    } else if (business) {
      createService.mutate({ ...data, business_id: business.id }, {
        onSuccess: () => setServiceDialogOpen(false),
      });
    }
  };

  const handleProductSubmit = (data: any) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...data }, {
        onSuccess: () => {
          setProductDialogOpen(false);
          setEditingProduct(null);
        },
      });
    } else if (business) {
      createProduct.mutate({ ...data, business_id: business.id }, {
        onSuccess: () => setProductDialogOpen(false),
      });
    }
  };

  const handleCreateBusiness = (data: { name: string; phone?: string; address?: string }) => {
    createBusiness.mutate(data);
  };

  useEffect(() => {
    if (editingService) {
      setServiceDialogOpen(true);
    }
  }, [editingService]);

  useEffect(() => {
    if (editingProduct) {
      setProductDialogOpen(true);
    }
  }, [editingProduct]);

  if (businessLoading) {
    return (
      <AppLayout title="Serviços & Produtos" subtitle="Gerencie seu catálogo">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Serviços & Produtos" subtitle="Gerencie seu catálogo">
      <CreateBusinessDialog
        open={!business && !businessLoading}
        onSubmit={handleCreateBusiness}
        isLoading={createBusiness.isPending}
      />

      <Tabs defaultValue="services" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Produtos
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingService(null); setServiceDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </div>

          {servicesLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Scissors className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setServiceDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar primeiro serviço
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <Card key={service.id} variant="elevated">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration_minutes} min
                      </span>
                      <span className="font-semibold text-foreground">
                        R$ {Number(service.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingService(service)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteService(service)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingProduct(null); setProductDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setProductDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar primeiro produto
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} variant="elevated">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {product.stock_quantity} em estoque
                      </span>
                      <span className="font-semibold text-foreground">
                        R$ {Number(product.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteProduct(product)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={(open) => {
          setServiceDialogOpen(open);
          if (!open) setEditingService(null);
        }}
        service={editingService}
        onSubmit={handleServiceSubmit}
        isLoading={createService.isPending || updateService.isPending}
      />

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        onSubmit={handleProductSubmit}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />

      <AlertDialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteService?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteService) {
                  deleteServiceMutation.mutate(deleteService.id);
                  setDeleteService(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteProduct?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteProduct) {
                  deleteProductMutation.mutate(deleteProduct.id);
                  setDeleteProduct(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
