import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase, Product, getFinalPrice } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, ShoppingCart, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selling, setSelling] = useState(false);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const startScan = async () => {
    setError(null);
    setProduct(null);
    setScanning(true);

    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        async (result) => {
          if (result) {
            const scannedId = result.getText();
            controlsRef.current?.stop();
            setScanning(false);
            setLoading(true);

            const { data, error: dbError } = await supabase
              .from("products")
              .select("*")
              .eq("id", scannedId)
              .single();

            setLoading(false);
            if (dbError || !data) {
              setError("Product not found. Please try again");
            } else {
              setProduct(data);
            }
          }
        }
      );
      controlsRef.current = controls;
    } catch {
      setError("Could not access camera. Please allow camera permissions.");
      setScanning(false);
    }
  };

  const stopScan = () => {
    controlsRef.current?.stop();
    setScanning(false);
  };

  const handleSell = async () => {
    if (!product || product.stock <= 0) return;
    setSelling(true);
    const newStock = product.stock - 1;
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", product.id);
    setSelling(false);

    if (updateError) {
      toast.error("Failed to record sale. Please try again.");
    } else {
      setProduct({ ...product, stock: newStock });
      toast.success(`Sale recorded. Stock remaining: ${newStock}`);
    }
  };

  const handleScanAgain = () => {
    setProduct(null);
    setError(null);
    startScan();
  };

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  const isOutOfStock = product && product.stock <= 0;

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Scan Product</h1>

      <div className="space-y-4">
        {!scanning && !product && !loading && (
          <Button onClick={startScan}>
            <Camera className="h-4 w-4 mr-2" />Start Scanning
          </Button>
        )}

        {scanning && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Point camera at barcode to scan</p>
              <Button variant="outline" size="sm" onClick={stopScan}>
                <CameraOff className="h-4 w-4 mr-2" />Stop
              </Button>
            </div>
            <div className="rounded-lg border overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" />
            </div>
          </>
        )}

        {/* Hidden video for ref when not visible */}
        {!scanning && <video ref={videoRef} className="hidden" />}

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
                  <span className="text-muted-foreground">Original Price</span>
                  <p className="font-mono font-medium">₹{product.price.toFixed(2)}</p>
                </div>
                {product.discount > 0 && (
                  <div>
                    <span className="text-muted-foreground">Discount</span>
                    <p className="font-medium">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{product.discount}%</span>
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Final Price</span>
                  <p className="font-mono font-bold text-primary">₹{getFinalPrice(product.price, product.discount).toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Stock Remaining</span>
                  <p className="font-medium">{product.stock}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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

        {error && (
          <Button variant="secondary" onClick={handleScanAgain}>
            <RotateCcw className="h-4 w-4 mr-2" />Scan Again
          </Button>
        )}
      </div>
    </div>
  );
}
