import { useState, useEffect } from "react";
import { Package, ArchiveRestore, AlertTriangle, Percent, TrendingUp, ShoppingBag, Calendar } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { getFinalPrice, supabase } from "@/lib/supabase";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

type Sale = {
  id: string;
  product_name: string;
  sku: string;
  category: string;
  original_price: number;
  discount: number;
  final_price: number;
  sold_by: string;
  created_at: string;
};

type DailySales = {
  date: string;
  revenue: number;
  items: number;
};

function StatCard({ title, value, icon: Icon, variant = "default", subtitle }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "success" | "accent";
  subtitle?: string;
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
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
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
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchSales();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSales, 30000);

    // Refresh on window focus
    const handleFocus = () => fetchSales();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const fetchSales = async () => {
    setSalesLoading(true);
    const { data } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSales(data as Sale[]);
    setSalesLoading(false);
  };

  // Generate chart data for selected time range
  const getChartData = (): DailySales[] => {
    const days = timeRange;
    const result: DailySales[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("en-IN", {
        month: "short", day: "numeric"
      });

      const daySales = sales.filter(s =>
        s.created_at.startsWith(dateStr)
      );

      result.push({
        date: label,
        revenue: daySales.reduce((sum, s) => sum + s.final_price, 0),
        items: daySales.length,
      });
    }
    return result;
  };

  // Get sales for selected date
  const getDailySales = (): Sale[] => {
    return sales.filter(s => s.created_at.startsWith(selectedDate));
  };

  const dailySales = getDailySales();
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter(s => s.created_at.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.final_price, 0);
  const chartData = getChartData();

  const totalProducts = products?.length ?? 0;
  const totalStock = products?.reduce((sum, p) => sum + p.stock, 0) ?? 0;
  const lowStockCount = products?.filter(p => p.stock < 5).length ?? 0;
  const activeDiscounts = products?.filter(p => p.discount > 0).length ?? 0;

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
          Failed to load data. Please check your connection.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={totalProducts} icon={Package} />
        <StatCard title="Total Stock" value={totalStock} icon={ArchiveRestore} variant="accent" />
        <StatCard title="Low Stock Alerts" value={lowStockCount} icon={AlertTriangle} variant="warning" />
        <StatCard title="Active Discounts" value={activeDiscounts} icon={Percent} variant="success" />
      </div>

      {/* Today's Sales Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`₹${todayRevenue.toFixed(2)}`}
          icon={TrendingUp}
          variant="accent"
          subtitle={`${todaySales.length} items sold today`}
        />
        <StatCard
          title="Total Sales"
          value={sales.length}
          icon={ShoppingBag}
          subtitle="All time sales recorded"
        />
      </div>

      {/* Sales Graph */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold">Sales Overview</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Range Toggle */}
            <div className="flex rounded-lg border overflow-hidden text-xs">
              {([7, 30, 90] as const).map(days => (
                <button
                  key={days}
                  onClick={() => setTimeRange(days)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    timeRange === days
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {days === 7 ? "7 Days" : days === 30 ? "30 Days" : "3 Months"}
                </button>
              ))}
            </div>
            {/* Chart Type Toggle */}
            <div className="flex rounded-lg border overflow-hidden text-xs">
              <button
                onClick={() => setChartType("bar")}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  chartType === "bar"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  chartType === "line"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                Line
              </button>
            </div>
          </div>
        </div>

        {salesLoading ? (
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        ) : sales.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No sales recorded yet. Start scanning products to see data here.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Daily Sales Record */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Daily Sales Record</h2>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>

        {salesLoading ? (
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        ) : dailySales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No sales recorded for {new Date(selectedDate).toLocaleDateString("en-IN", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </div>
        ) : (
          <>
            {/* Daily Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold">{dailySales.length}</p>
                <p className="text-xs text-muted-foreground">Items Sold</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold">
                  ₹{dailySales.reduce((sum, s) => sum + s.final_price, 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold">
                  ₹{dailySales.reduce((sum, s) => sum + (s.original_price - s.final_price), 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Discounts Given</p>
              </div>
            </div>

            {/* Sales List */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">SKU</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-right p-3 font-medium">Price</th>
                    <th className="text-right p-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.map(sale => (
                    <tr key={sale.id} className="border-t">
                      <td className="p-3 font-medium">{sale.product_name}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{sale.sku}</td>
                      <td className="p-3 text-muted-foreground">{sale.category}</td>
                      <td className="p-3 text-right font-mono">₹{sale.final_price.toFixed(2)}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        {new Date(sale.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Low Stock Items */}
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
                    <td className="p-3 text-right font-mono">
                      ₹{getFinalPrice(p.price, p.discount).toFixed(2)}
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
