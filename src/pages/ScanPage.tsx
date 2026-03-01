import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase, Product, getFinalPrice } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const startScan = async () => {
    setError(null);
    setProduct(null);
    setScanning(true);

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

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
              setError("Product not found");
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

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Scan Product</h1>

      <div className="space-y-4">
        {!scanning ? (
          <Button onClick={startScan}><Camera className="h-4 w-4 mr-2" />Start Scanning</Button>
        ) : (
          <Button variant="outline" onClick={stopScan}><CameraOff className="h-4 w-4 mr-2" />Stop</Button>
        )}

        <div className={`rounded-lg border overflow-hidden bg-black aspect-video ${!scanning ? "hidden" : ""}`}>
          <video ref={videoRef} className="w-full h-full object-cover" />
        </div>

        {loading && <div className="h-32 bg-muted animate-pulse rounded-lg" />}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive font-medium">
            {error}
          </div>
        )}

        {product && (
          <div className="rounded-lg border bg-card p-5 space-y-3 animate-fade-in">
            <h2 className="text-xl font-bold">{product.name}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Category</span>
                <p className="font-medium">{product.category}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Original Price</span>
                <p className="font-mono font-medium">${product.price.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Discount</span>
                <p className="font-medium">
                  {product.discount > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{product.discount}%</span>
                  ) : "None"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Final Price</span>
                <p className="font-mono font-bold text-primary">${getFinalPrice(product.price, product.discount).toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Stock Remaining</span>
                <p className="font-medium">
                  {product.stock < 5 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive">{product.stock} — Low Stock</span>
                  ) : product.stock}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
