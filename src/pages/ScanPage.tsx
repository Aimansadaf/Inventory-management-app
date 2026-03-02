import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { supabase, Product, getFinalPrice } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, ShoppingCart, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

function ScanOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="w-64 h-40 relative">
        {/* Red rectangle corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-destructive rounded-tl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-destructive rounded-tr" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-destructive rounded-bl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-destructive rounded-br" />
        {/* Scan line animation */}
        <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-destructive/60 animate-pulse" />
      </div>
    </div>
  );
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selling, setSelling] = useState(false);
  const controlsRef = useRef<IScannerControls | null>(null);

  const startScan = useCallback(async () => {
    setError(null);
    setProduct(null);
    setScanning(true);
  }, []);

  // Start camera only after video element is visible in DOM
  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    let cancelled = false;

    const initCamera = async () => {
      try {
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current!,
          async (result, err, ctrls) => {
            if (cancelled) return;
            if (err && !(err instanceof NotFoundException)) {
              console.warn("Scan frame error:", err);
              return;
            }

            if (result) {
              const scannedId = result.getText();
              console.log("Barcode detected:", scannedId);
              ctrls.stop();
              controlsRef.current = null;
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
        if (!cancelled) {
          controlsRef.current = controls;
        } else {
          controls.stop();
        }
      } catch (e) {
        console.error("Camera error:", e);
        if (!cancelled) {
          setError("Camera not available. Please check permissions.");
          setScanning(false);
        }
      }
    };

    initCamera();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [scanning]);

  const stopScan = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
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
              <p className="text-sm text-destructive font-semibold animate-pulse">
                📷 Point camera at barcode
              </p>
              <Button variant="outline" size="sm" onClick={stopScan}>
                <CameraOff className="h-4 w-4 mr-2" />Stop
              </Button>
            </div>
            <div className="rounded-lg border overflow-hidden bg-black aspect-video relative">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              <ScanOverlay />
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
