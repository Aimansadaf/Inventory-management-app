import { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { getFinalPrice, CATEGORIES } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function Products() {
  const { data: products, isLoading, error } = useProducts();
  const deleteProduct = useDeleteProduct();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = products?.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  }) ?? [];

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link to="/products/new"><Plus className="h-4 w-4 mr-2" />Add Product</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          Failed to load products. Check your Supabase connection.
        </div>
      )}

      {!isLoading && !error && (
        <div className="rounded-lg border overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                 <tr>
                   <th className="text-left p-3 font-medium">SKU</th>
                   <th className="text-left p-3 font-medium">Name</th>
                   <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Price</th>
                  <th className="text-right p-3 font-medium">Stock</th>
                  <th className="text-right p-3 font-medium">Discount</th>
                  <th className="text-right p-3 font-medium">Final Price</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">No products found</td>
                  </tr>
                ) : filtered.map(p => (
                   <tr key={p.id} className="border-t hover:bg-muted/50 transition-colors">
                     <td className="p-3 font-mono text-xs">{p.sku}</td>
                     <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-muted-foreground">{p.category}</td>
                    <td className="p-3 text-right font-mono">₹{p.price.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      {p.stock < 5 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                          {p.stock} — Low Stock
                        </span>
                      ) : p.stock}
                    </td>
                    <td className="p-3 text-right">
                      {p.discount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {p.discount}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-right font-mono font-medium">₹{getFinalPrice(p.price, p.discount).toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/products/edit/${p.id}`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.name)} disabled={deleteProduct.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
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
