import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface SaleRecord {
  id: string;
  product_name: string;
  sku: string;
  category: string;
  final_price: number;
  discount: number;
  sold_by: string;
  created_at: string;
}

interface StaffSummary {
  email: string;
  totalSales: number;
  totalRevenue: number;
}

export default function StaffActivity() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [filtered, setFiltered] = useState<SaleRecord[]>([]);
  const [staffList, setStaffList] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const records = data || [];
      setSales(records);

      // Get unique staff emails
      const emails = [...new Set(records.map((s) => s.sold_by).filter(Boolean))];
      setStaffList(emails);
    } catch (err: any) {
      toast.error("Failed to load activity: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  useEffect(() => {
    let result = [...sales];

    // Filter by date range
    const now = new Date();
    if (dateRange === "today") {
      result = result.filter(s => {
        const d = new Date(s.created_at);
        return d.toDateString() === now.toDateString();
      });
    } else if (dateRange === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      result = result.filter(s => {
        const d = new Date(s.created_at);
        return d.toDateString() === yesterday.toDateString();
      });
    } else if (dateRange === "7days") {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      result = result.filter(s => new Date(s.created_at) >= cutoff);
    } else if (dateRange === "30days") {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      result = result.filter(s => new Date(s.created_at) >= cutoff);
    }

    // Filter by staff
    if (selectedStaff !== "all") {
      result = result.filter(s => s.sold_by === selectedStaff);
    }

    setFiltered(result);
  }, [sales, dateRange, selectedStaff]);

  // Summary cards
  const totalRevenue = filtered.reduce((sum, s) => sum + s.final_price, 0);
  const totalSales = filtered.length;

  // Most active staff
  const staffSummary: StaffSummary[] = staffList.map(email => {
    const staffSales = filtered.filter(s => s.sold_by === email);
    return {
      email,
      totalSales: staffSales.length,
      totalRevenue: staffSales.reduce((sum, s) => sum + s.final_price, 0),
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const mostActive = staffSummary[0];

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Staff Activity</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {staffList.map(email => (
              <SelectItem key={email} value={email}>{email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSales}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Most Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold truncate">
              {mostActive ? mostActive.email : "—"}
            </p>
            {mostActive && (
              <p className="text-xs text-muted-foreground">
                {mostActive.totalSales} sales · ₹{mostActive.totalRevenue.toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Breakdown */}
      {staffSummary.length > 0 && selectedStaff === "all" && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted px-4 py-2 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Staff Breakdown</span>
          </div>
          <div className="divide-y">
            {staffSummary.map((s, i) => (
              <div key={s.email} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Badge variant={i === 0 ? "default" : "secondary"}>
                    #{i + 1}
                  </Badge>
                  <span className="text-sm font-medium">{s.email}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">₹{s.totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{s.totalSales} sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted px-4 py-2">
          <span className="text-sm font-medium">Activity Log</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Time</th>
                <th className="text-left p-3 font-medium">Staff</th>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-left p-3 font-medium">SKU</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-right p-3 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No activity found for this period
                  </td>
                </tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-muted-foreground">{formatDate(s.created_at)}</td>
                  <td className="p-3 text-muted-foreground">{formatTime(s.created_at)}</td>
                  <td className="p-3">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {s.sold_by}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{s.product_name}</td>
                  <td className="p-3 font-mono text-xs">{s.sku}</td>
                  <td className="p-3 text-muted-foreground">{s.category}</td>
                  <td className="p-3 text-right font-mono font-medium">
                    ₹{s.final_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}