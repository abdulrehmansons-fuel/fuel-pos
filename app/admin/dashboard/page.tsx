"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Fuel,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Activity,
  CreditCard,
  Wallet
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import { format, subMonths, startOfMonth } from "date-fns";

interface DashboardSaleItem {
  category: string;
  fuelType?: string;
  rate?: number;
  total?: number;
  quantityInLiters?: number;
  quantity?: number;
  price?: number;
  totalPrice?: number;
}

interface DashboardSale {
  status?: string;
  items?: DashboardSaleItem[];
  grandTotal?: number;
  createdAt: string | Date;
  id?: string;
  _id?: string;
}

interface DashboardStock {
  fuelType: string;
  purchasePricePerLiter?: number;
  purchasePrice?: number;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    profitMargin: "0",
    totalFuelSold: 0,
    revGrowth: 0,
    expGrowth: 0,
    volGrowth: 0
  });

  const [charts, setCharts] = useState({
    financialData: [] as { name: string; fullDate: Date; revenue: number; expenses: number }[],
    fuelSalesData: [] as { name: string; value: number; color: string }[],
    recentSales: [] as { id: string; product: string; amount: number; status: string; time: string }[],
    stockAlerts: [] as { item: string; current: number; min: number; status: string }[]
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [salesRes, expensesRes, stocksRes, pumpsRes] = await Promise.all([
          fetch("/api/sales"),
          fetch("/api/expenses"),
          fetch("/api/stocks"),
          fetch("/api/fuel-pumps")
        ]);

        const [sales, expenses, stocks] = await Promise.all([
          salesRes.json(),
          expensesRes.json(),
          stocksRes.json(),
          pumpsRes.json()
        ]);

        const salesArr = Array.isArray(sales) ? sales : [];
        const expensesArr = Array.isArray(expenses) ? expenses : [];
        const stocksArr = Array.isArray(stocks) ? stocks : [];

        // Filter for Approved Sales only
        const approvedSales = salesArr.filter((s: { status?: string }) => s.status === "Approved");

        // 1. Accurate Metrics (Based on Approved Sales)
        const totalRevenue = approvedSales.reduce((sum: number, s: { grandTotal?: number }) => sum + (s.grandTotal || 0), 0);

        // Calculate Total Profit (Sales margin only: Sale Price - Purchase Price)
        const totalProfitFromSales = approvedSales.reduce((totalSum: number, s: DashboardSale) => {
          const saleProfit = s.items?.reduce((sum: number, item: DashboardSaleItem) => {
            const stockItem = stocksArr.find((st: DashboardStock) => st.fuelType === (item.category || item.fuelType));
            const purchasePrice = stockItem?.purchasePricePerLiter || stockItem?.purchasePrice || 0;
            const salePrice = item.rate || (item.total && (item.quantityInLiters || item.quantity) ? item.total / (item.quantityInLiters || item.quantity!) : 0) || 0;
            const quantity = item.quantityInLiters || item.quantity || 0;
            return sum + ((salePrice - purchasePrice) * quantity);
          }, 0) || 0;
          return totalSum + saleProfit;
        }, 0);

        const totalExpenses = expensesArr.reduce((sum: number, e: { amount?: string | number }) => sum + (Number(e.amount) || 0), 0);
        const profitMargin = totalRevenue > 0 ? ((totalProfitFromSales / totalRevenue) * 100).toFixed(1) : "0";

        const totalFuelSold = approvedSales.reduce((sum: number, s: { items?: { quantity?: number; quantityInLiters?: number }[] }) => {
          return sum + (s.items?.reduce((iSum: number, item: { quantity?: number; quantityInLiters?: number }) => iSum + (item.quantity || item.quantityInLiters || 0), 0) || 0);
        }, 0);

        // 2. Financial Overview Chart (Last 7 Months)
        const last7Months = Array.from({ length: 7 }, (_, i) => {
          const d = subMonths(new Date(), 6 - i);
          return {
            name: format(d, "MMM"),
            fullDate: startOfMonth(d),
            revenue: 0,
            expenses: 0
          };
        });

        approvedSales.forEach((s: { createdAt: string | Date; grandTotal?: number }) => {
          const sDate = new Date(s.createdAt);
          const monthIndex = last7Months.findIndex(m =>
            m.fullDate.getMonth() === sDate.getMonth() && m.fullDate.getFullYear() === sDate.getFullYear()
          );
          if (monthIndex > -1) {
            last7Months[monthIndex].revenue += (s.grandTotal || 0);
          }
        });

        expensesArr.forEach((e: { date?: string; createdAt: string; amount?: string | number }) => {
          const eDate = new Date(e.date || e.createdAt);
          const monthIndex = last7Months.findIndex(m =>
            m.fullDate.getMonth() === eDate.getMonth() && m.fullDate.getFullYear() === eDate.getFullYear()
          );
          if (monthIndex > -1) {
            last7Months[monthIndex].expenses += (Number(e.amount) || 0);
          }
        });

        // 3. Fuel Sales Distribution
        const categoryMap: Record<string, { value: number; color: string }> = {
          "Petrol": { value: 0, color: "#14b8a6" },
          "Diesel": { value: 0, color: "#3b82f6" },
          "High-Octane": { value: 0, color: "#8b5cf6" },
          "Lubricants": { value: 0, color: "#f59e0b" }
        };

        approvedSales.forEach((s: { items?: { category?: string; quantity?: number; quantityInLiters?: number }[] }) => {
          s.items?.forEach((item: { category?: string; quantity?: number; quantityInLiters?: number }) => {
            const cat = item.category || "Other";
            if (categoryMap[cat]) {
              categoryMap[cat].value += (item.quantity || item.quantityInLiters || 0);
            } else {
              categoryMap[cat] = { value: (item.quantity || item.quantityInLiters || 0), color: "#94a3b8" };
            }
          });
        });

        const totalVol = Object.values(categoryMap).reduce((sum, c) => sum + (c.value || 0), 0);
        const fuelSalesData = Object.entries(categoryMap)
          .filter(([, data]) => data.value > 0)
          .map(([name, data]) => ({
            name,
            value: totalVol > 0 ? Math.round((data.value / totalVol) * 100) : 0,
            color: data.color
          }));

        // 4. Recent Sales (Last 5 Approved)
        const recentSales = approvedSales.slice(0, 5).map((s: { id?: string; _id?: string; items?: { productName?: string; category?: string }[]; grandTotal?: number; status?: string; createdAt: string }) => ({
          id: s.id || (s._id ? s._id.slice(-5).toUpperCase() : "N/A"),
          product: s.items?.[0]?.productName || s.items?.[0]?.category || "Fuel",
          amount: s.grandTotal || 0,
          status: s.status?.toLowerCase() || "pending",
          time: format(new Date(s.createdAt), "hh:mm a")
        }));

        // 5. Stock Alerts (Threshold < 100L)
        const stockThreshold = 100;
        const stockAlerts = stocksArr
          .filter((st: { quantity?: string | number }) => (Number(st.quantity) || 0) < stockThreshold)
          .map((st: { fuelType: string; pump?: string; quantity?: string | number }) => ({
            item: `${st.fuelType} (${st.pump || 'Main'})`,
            current: Number(st.quantity) || 0,
            min: stockThreshold,
            status: Number(st.quantity) < 50 ? "critical" : "low"
          }));

        setMetrics({
          totalRevenue,
          totalExpenses,
          totalProfit: totalProfitFromSales,
          profitMargin,
          totalFuelSold,
          revGrowth: 12.5,
          expGrowth: 4.2,
          volGrowth: 8.1
        });

        setCharts({
          financialData: last7Months,
          fuelSalesData: fuelSalesData.length > 0 ? fuelSalesData : [{ name: "No Data", value: 100, color: "#e2e8f0" }],
          recentSales,
          stockAlerts
        });

      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6]"></div>
      </div>
    );
  }

  const { totalRevenue, totalExpenses, totalProfit, profitMargin, totalFuelSold, revGrowth, expGrowth, volGrowth } = metrics;
  const { financialData, fuelSalesData, recentSales, stockAlerts } = charts;

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#020617]">Dashboard Overview</h1>
          <p className="text-[#64748b]">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>

      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <Card className="bg-white border-none shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#64748b]">Total Revenue</p>
                <h3 className="text-2xl font-bold text-[#020617] mt-2">
                  Rs. {totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-600 flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                {revGrowth}%
              </span>
              <span className="text-[#94a3b8] ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="bg-white border-none shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#64748b]">Total Expenses</p>
                <h3 className="text-2xl font-bold text-[#020617] mt-2">
                  Rs. {totalExpenses.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-red-600 flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                {expGrowth}%
              </span>
              <span className="text-[#94a3b8] ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Profit Card */}
        <Card className="bg-white border-none shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#64748b]">Total Profit</p>
                <h3 className="text-2xl font-bold text-[#020617] mt-2">
                  Rs. {totalProfit.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-blue-600 flex items-center font-medium">
                <Activity className="h-4 w-4 mr-1" />
                {profitMargin}%
              </span>
              <span className="text-[#94a3b8] ml-2">margin</span>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Sold Card */}
        <Card className="bg-white border-none shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#64748b]">Fuel Sold</p>
                <h3 className="text-2xl font-bold text-[#020617] mt-2">
                  {totalFuelSold.toLocaleString()} L
                </h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Fuel className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-600 flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                {volGrowth}%
              </span>
              <span className="text-[#94a3b8] ml-2">volume increase</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Chart */}
        <Card className="lg:col-span-2 bg-white border-none shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#020617]">Financial Overview</CardTitle>
            <CardDescription>Revenue vs Expenses for the last 7 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `Rs.${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExpenses)"
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Sales Distribution */}
        <Card className="bg-white border-none shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#020617]">Sales by Fuel Type</CardTitle>
            <CardDescription>Distribution of fuel sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuelSalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fuelSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#020617]">100%</p>
                  <p className="text-xs text-[#64748b]">Total Volume</p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {fuelSalesData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#64748b]">{item.name}</span>
                  </div>
                  <span className="font-medium text-[#020617]">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Recent Sales & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Table */}
        <Card className="lg:col-span-2 bg-white border-none shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-[#020617]">Recent Sales</CardTitle>
              <CardDescription>Latest transactions from all pumps</CardDescription>
            </div>
            <Link href="/admin/sales">
              <Button variant="ghost" size="sm" className="text-[#14b8a6]">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell className="text-[#64748b]">{sale.product}</TableCell>
                      <TableCell className="font-medium">Rs. {sale.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            sale.status === 'approved'
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                          }
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-[#64748b]">{sale.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card className="bg-white border-none shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#020617]">Stock Alerts</CardTitle>
            <CardDescription>Items running low on inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockAlerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[#020617]">{alert.item}</h4>
                    <p className="text-xs text-red-600 mt-1">
                      Current: {alert.current} L (Min: {alert.min} L)
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 bg-white border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
                    Restock
                  </Button>
                </div>
              ))}

              <div className="flex items-start gap-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[#020617]">Inventory Audit</h4>
                  <p className="text-xs text-amber-600 mt-1">
                    Scheduled for tomorrow
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
