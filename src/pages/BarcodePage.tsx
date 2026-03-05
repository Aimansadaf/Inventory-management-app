import { useEffect, useRef, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import JsBarcode from "jsbarcode";

export default function BarcodePage() {
  const { data: products, isLoading } = useProducts();
  const [selectedId, setSelectedId] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedProduct = products?.find(p => p.id === selectedId);

  useEffect(() => {
    if (selectedProduct?.sku && svgRef.current) {
      JsBarcode(svgRef.current, selectedProduct.sku, {
        format: "CODE128",
        width: 3,
        height: 100,
        displayValue: true,
        fontSize: 18,
        font: "JetBrains Mono",
        margin: 20,
      });
    }
  }, [selectedProduct?.sku]);

  const handlePrint = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const win = window.open("", "_blank");
    if (!win) return;
    const product = selectedProduct;
    win.document.write(`
      <html><head><title>Barcode - ${product?.name ?? ""}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;}
      h2{margin-bottom:8px;} p{color:#666;margin:0 0 24px;}</style></head>
      <body>
        <h2>${product?.name ?? ""}</h2>
        <p>${product?.category ?? ""}</p>
        ${svgData}
        <script>window.print();window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Barcode Generator</h1>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Product</label>
          {isLoading ? (
            <div className="h-10 bg-muted animate-pulse rounded" />
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product..." />
              </SelectTrigger>
              <SelectContent>
                {products?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedId && (
          <div className="rounded-lg border bg-card p-6 flex flex-col items-center gap-4 animate-fade-in">
            <svg ref={svgRef} />
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />Print Barcode
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}