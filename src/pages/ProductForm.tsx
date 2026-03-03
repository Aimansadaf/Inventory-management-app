import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProduct, useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { CATEGORIES } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: existing, isLoading: loadingExisting } = useProduct(id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: CATEGORIES[0] as string,
    price: "",
    stock: "",
    discount: "0",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        sku: existing.sku || "",
        category: existing.category,
        price: String(existing.price),
        stock: String(existing.stock),
        discount: String(existing.discount),
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      discount: parseFloat(form.discount) || 0,
    };
    if (form.sku.trim()) {
      payload.sku = form.sku.trim();
    }

    if (!payload.name || isNaN(payload.price) || isNaN(payload.stock)) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id, ...payload });
        toast.success("Product updated");
      } else {
        await createProduct.mutateAsync(payload as any);
        toast.success("Product created");
      }
      navigate("/products");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  if (isEdit && loadingExisting) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? "Edit Product" : "Add Product"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Classic Hoodie" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Auto-generated (e.g. CLT001)" />
          <p className="text-xs text-muted-foreground">Leave blank to auto-generate</p>
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹) *</Label>
            <Input id="price" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock *</Label>
            <Input id="stock" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount">Discount (%)</Label>
          <Input id="discount" type="number" step="0.1" min="0" max="100" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="0" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/products")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
