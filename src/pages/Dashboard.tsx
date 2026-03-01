import { Package, ArchiveRestore, AlertTriangle, Percent } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { getFinalPrice } from "@/lib/supabase";

function StatCard({ title, value, icon: Icon, variant = "default" }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "success" | "accent";
}) {
  const variantClasses = {
    default: "bg-card border",
    warning: "bg-destructive/10 border-destructive/20",
    success: "bg-accent border-primary/20",
    accent: "bg-primary/10 border-primary/20",
  };

  return (
    <div className={`rounded-lg p-5 ${variantClasses[variant]} animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          Failed to load data. Please check your Supabase connection.
        </div>
      </div>
    );
  }

  const totalProducts = products?.length ?? 0;
  const totalStock = products?.reduce((sum, p) => sum + p.stock, 0) ?? 0;
  const lowStockCount = products?.filter(p => p.stock < 5).length ?? 0;
  const activeDiscounts = products?.filter(p => p.discount > 0).length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={totalProducts} icon={Package} />
        <StatCard title="Total Stock" value={totalStock} icon={ArchiveRestore} variant="accent" />
        <StatCard title="Low Stock Alerts" value={lowStockCount} icon={AlertTriangle} variant="warning" />
        <StatCard title="Active Discounts" value={activeDiscounts} icon={Percent} variant="success" />
      </div>

      {lowStockCount > 0 && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-semibold mb-3">Low Stock Items</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Stock</th>
                  <th className="text-right p-3 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {products?.filter(p => p.stock < 5).map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-muted-foreground">{p.category}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        {p.stock} left
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">₹{getFinalPrice(p.price, p.discount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
