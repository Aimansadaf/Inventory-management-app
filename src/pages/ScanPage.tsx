import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { supabase, Product, getFinalPrice } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, CameraOff, ShoppingCart, RotateCcw, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function ScanPage() {
  const { profile } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selling, setSelling] = useState(false);
  const [manualSku, setManualSku] = useState("");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (e) {
      console.warn("Stop error:", e);
    }
    setScanning(false);
  }, []);

  const lookupProduct = useCallback(async (scannedValue: string) => {
    const trimmed = scannedValue.trim();
    setDebugInfo(`Searching for SKU: "${trimmed}"`);
    setLoading(true);
    setError(null);
    setProduct(null);

    // Try exact SKU match first
    const { data, error: dbError } = await supabase
      .from("products")
      .select("*")
      .ilike("sku", trimmed)
      .single();

    setLoading(false);

    if (dbError || !data) {
      // Try searching by ID as fallback
      const { data: dataById } = await supabase
        .from("products")
        .select("*")
        .eq("id", trimmed)
        .single();

      if (dataById) {
        setDebugInfo(`Found by ID: "${trimmed}"`);
        setProduct(dataById);
      } else {
        setDebugInfo(`Not found. Searched SKU: "${trimmed}"`);
        setError(`Product not found for: "${trimmed}". Please check the SKU and try again.`);
      }
    } else {
      setDebugInfo(`Found: ${data.name} (SKU: ${data.sku})`);
      setProduct(data);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    setProduct(null);
    setDebugInfo(null);
    setScanning(true);

    await new Promise((r) => setTimeout(r, 100));

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        verbose: false,
      });
    }

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decodedText) => {
          console.log("Barcode detected:", decodedText);
          await stopScanner();
          await lookupProduct(decodedText);
        },
        () => {}
      );
    } catch (e: any) {
      console.error("Camera error:", e);
      const msg = e?.toString?.().includes("NotAllowedError")
        ? "Please allow camera access to scan barcodes"
        : "Camera not available. Please check permissions.";
      setError(msg);
      setScanning(false);
    }
  }, [stopScanner, lookupProduct]);

  const handleManualSearch = () => {
    if (!manualSku.trim()) return;
    lookupProduct(manualSku.trim());
  };

  const handleSell = async () => {
    if (!product || product.stock <= 0) return;
    setSelling(true);
    const newStock = product.stock - 1;
    const finalPrice = getFinalPrice(product.price, product.discount);

    // Update stock
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", product.id);

    if (updateError) {
      setSelling(false);
      toast.error("Failed to record sale. Please try again.");
      return;
    }

    // Record sale
    const { error: saleError } = await supabase
      .from("sales")
      .insert({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        category: product.category,
        original_price: product.price,
        discount: product.discount,
        final_price: finalPrice,
        sold_by: profile?.email || "unknown",
      });

    setSelling(false);

    if (saleError) {
      toast.error("Stock updated but failed to log sale: " + saleError.message);
    } else {
      setProduct({ ...product, stock: newStock });
      toast.success(`Sale recorded. Stock remaining: ${newStock}`);
    }
  };

  const handleScanAgain = () => {
    setProduct(null);
    setError(null);
    setDebugInfo(null);
    setManualSku("");
    startScanner();
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const isOutOfStock = product && product.stock <= 0;

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Scan Product</h1>

      <div className="space-y-4">

        {/* MANUAL SKU ENTRY */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">
            Enter SKU Manually
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. CLT001"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              className="flex-1"
            />
            <Button onClick={handleManualSearch} disabled={!manualSku.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* DEBUG INFO */}
        {debugInfo && (
          <div className="rounded-lg border bg-muted p-3 text-xs font-mono text-muted-foreground">
            🔍 {debugInfo}
          </div>
        )}

        {/* CAMERA SCANNER */}
        {!scanning && !product && !loading && (
          <Button onClick={startScanner} variant="outline" className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Start Camera Scanner
          </Button>
        )}

        {scanning && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive font-semibold animate-pulse">
                📷 Point camera at barcode
              </p>
              <Button variant="outline" size="sm" onClick={stopScanner}>
                <CameraOff className="h-4 w-4 mr-2" />Stop
              </Button>
            </div>
            <div className="rounded-lg border overflow-hidden bg-black">
              <div id="reader" className="w-full" />
            </div>
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 h-32 bg-muted rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Looking up product…</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive font-medium">
            {error}
          </div>
        )}

        {product && (
          <>
            <div className="rounded-lg border bg-card p-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{product.name}</h2>
                {isOutOfStock ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
                    Out of Stock
                  </span>
                ) : product.stock < 5 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
                    Low Stock
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">SKU</span>
                  <p className="font-mono font-medium">{product.sku}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Original Price</span>
                  <p className="font-mono font-medium">₹{product.price.toFixed(2)}</p>
                </div>
                {product.discount > 0 && (
                  <div>
                    <span className="text-muted-foreground">Discount</span>
                    <p className="font-medium">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                        {product.discount}%
                      </span>
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Final Price</span>
                  <p className="font-mono font-bold text-primary">
                    ₹{getFinalPrice(product.price, product.discount).toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Stock Remaining</span>
                  <p className="font-medium">{product.stock}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                variant="default"
                onClick={handleSell}
                disabled={!!isOutOfStock || selling}
              >
                {selling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4 mr-2" />
                )}
                {isOutOfStock ? "Out of Stock — Cannot sell" : "Sell Item"}
              </Button>
              <Button variant="secondary" onClick={handleScanAgain}>
                <RotateCcw className="h-4 w-4 mr-2" />Scan Again
              </Button>
            </div>
          </>
        )}

        {error && !product && (
          <Button variant="secondary" onClick={handleScanAgain}>
            <RotateCcw className="h-4 w-4 mr-2" />Try Again
          </Button>
        )}

      </div>
    </div>
  );
}