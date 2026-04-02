"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from "lucide-react";


import { toast } from "sonner";

// Import report components
import { OverviewReport } from "./OverviewReport";
import { SalesReport } from "./SalesReport";
import { EmployerReport } from "./EmployerReport";
import { PumpsReport } from "./PumpsReport";
import { ExpenseReport } from "./ExpenseReport";
import { StocksReport } from "./StocksReport";
import { CreditsReport } from "./CreditsReport";
import { ReportData } from "./types";

export default function ReportsMainPage() {
    const [selectedPump, setSelectedPump] = useState<string>("all");
    const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
    const [toDate, setToDate] = useState<Date | undefined>(undefined);
    const [rawData, setRawData] = useState<ReportData>({ sales: [], employers: [], pumps: [], expenses: [], stocks: [], credits: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [pumpsList, setPumpsList] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [salesRes, employersRes, pumpsRes, expensesRes, stocksRes, creditsRes] = await Promise.all([
                    fetch("/api/sales"),
                    fetch("/api/employers"),
                    fetch("/api/fuel-pumps"),
                    fetch("/api/expenses"),
                    fetch("/api/stocks"),
                    fetch("/api/reports/credits"),
                ]);

                const [sales, employers, pumps, expenses, stocks, credits] = await Promise.all([
                    salesRes.json(),
                    employersRes.json(),
                    pumpsRes.json(),
                    expensesRes.json(),
                    stocksRes.json(),
                    creditsRes.json(),
                ]);

                // Map Stocks
                const mappedStocks = (Array.isArray(stocks) ? stocks : []).map((st: { fuelType: string; quantity: string | number; salePricePerLiter: string | number; purchasePricePerLiter?: string | number; pump?: string; updatedAt?: string; createdAt?: string }) => ({
                    fuelType: st.fuelType,
                    quantity: Number(st.quantity) || 0,
                    price: Number(st.salePricePerLiter) || 0,
                    purchasePrice: Number(st.purchasePricePerLiter) || 0,
                    location: st.pump || "N/A",
                    lastUpdated: st.updatedAt || st.createdAt,
                    pumpId: st.pump,
                }));

                // Map Employers
                const mappedEmployers = (Array.isArray(employers) ? employers : []).map((e: { fullName: string; fuelPump?: string; role?: string; email: string; joiningDate: string; status?: string; monthlySalary?: number }) => ({
                    employerName: e.fullName,
                    pump: e.fuelPump || "N/A",
                    role: e.role || "Employee",
                    email: e.email,
                    dateJoined: e.joiningDate,
                    status: e.status || "Active",
                    pumpId: e.fuelPump,
                    salary: e.monthlySalary || 0,
                }));

                // Map Pumps
                const mappedPumps = (Array.isArray(pumps) ? pumps : []).map((p: { _id?: string; pumpName: string; fuelProducts: string[] | string; status?: string; updatedAt?: string; createdAt?: string }) => ({
                    pumpId: p._id ? p._id.slice(-6).toUpperCase() : "N/A",
                    location: p.pumpName,
                    fuelType: Array.isArray(p.fuelProducts) ? p.fuelProducts.join(", ") : p.fuelProducts || "N/A",
                    status: p.status || "Active",
                    lastMaintenance: p.updatedAt || p.createdAt,
                    totalDispensed: 0,
                }));

                // Map Expenses
                const mappedExpenses = (Array.isArray(expenses) ? expenses : []).map((ex: { _id?: string; date: string; expenseType: string; amount: string | number; expenseTitle: string; pump?: string }) => ({
                    expenseId: ex._id ? ex._id.slice(-6).toUpperCase() : "N/A",
                    date: ex.date,
                    category: ex.expenseType,
                    amount: Number(ex.amount) || 0,
                    description: ex.expenseTitle,
                    location: ex.pump || "N/A",
                    pumpId: ex.pump,
                }));

                // Map Sales
                const mappedSales = (Array.isArray(sales) ? sales : []).map((s: { id?: string; _id?: string; createdAt?: string; items?: { category?: string; quantityInLiters?: number; quantity?: number; rate?: number; purchaseRate?: number; purchaseTotal?: number }[]; grandTotal?: number; pumpId?: { pumpName?: string; _id?: string } | string; status?: string }) => {
                    const pumpName = (typeof s.pumpId === 'object' ? s.pumpId?.pumpName : s.pumpId) || "N/A";

                    // Calculate purchase price and profit
                    let totalPurchasePrice = 0;
                    s.items?.forEach(item => {
                        const quantity = item.quantityInLiters || item.quantity || 0;

                        // Priority 1: Use stored total cost from Sale record (The most accurate, FIFO-based)
                        if (item.purchaseTotal !== undefined && item.purchaseTotal > 0) {
                            totalPurchasePrice += item.purchaseTotal;
                        }
                        // Priority 2: Use stored rate * quantity
                        else if (item.purchaseRate !== undefined && item.purchaseRate > 0) {
                            totalPurchasePrice += item.purchaseRate * quantity;
                        }
                        // Priority 3: Fallback for old records (Estimate based on current stock price)
                        else {
                            const matchingStocks = mappedStocks.filter(st => st.fuelType === item.category && st.location === pumpName);
                            const purchasePrice = matchingStocks.length > 0 ? matchingStocks[0].purchasePrice : 0;
                            totalPurchasePrice += purchasePrice * quantity;
                        }
                    });

                    const totalPrice = s.grandTotal || 0;
                    const totalProfit = totalPrice - totalPurchasePrice;

                    return {
                        orderId: s.id || (s._id ? s._id.slice(-6).toUpperCase() : "N/A"),
                        date: s.createdAt || "",
                        fuelType: s.items?.[0]?.category || "N/A",
                        quantity: s.items?.reduce((sum: number, item: { quantityInLiters?: number; quantity?: number }) => sum + (item.quantityInLiters || item.quantity || 0), 0) || 0,
                        totalPrice: totalPrice,
                        purchasePrice: totalPurchasePrice,
                        totalProfit: totalProfit,
                        pump: pumpName,
                        status: s.status || "Pending",
                        pumpId: (typeof s.pumpId === 'object' ? s.pumpId?._id : s.pumpId) || "",
                    };
                });

                setRawData({
                    sales: mappedSales,
                    employers: mappedEmployers,
                    pumps: mappedPumps,
                    expenses: mappedExpenses,
                    stocks: mappedStocks,
                    credits: Array.isArray(credits) ? credits : [],
                });

                if (Array.isArray(pumps)) {
                    setPumpsList(pumps.map((p: { pumpName: string }) => p.pumpName));
                }

            } catch (error) {
                console.error("Error fetching report data:", error);
                toast.error("Failed to load real-time report data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter data based on selected pump and date range
    const getFilteredData = () => {
        const filterByPumpAndDate = <T extends { date?: string; dateJoined?: string; lastMaintenance?: string; lastUpdated?: string; pumpId?: string; pump?: string; location?: string; status?: string }>(items: T[], isSales: boolean = false) => {
            return items.filter((item) => {
                const itemDate = new Date(item.date || item.dateJoined || item.lastMaintenance || item.lastUpdated || "");
                const matchesPump = selectedPump === "all" || item.pumpId === selectedPump || item.pump === selectedPump || item.location === selectedPump;
                const matchesDate = !fromDate || !toDate || (itemDate >= fromDate && itemDate <= toDate);
                const matchesStatus = !isSales || item.status === "Approved";

                return matchesPump && matchesDate && matchesStatus;
            });
        };

        return {
            sales: filterByPumpAndDate(rawData.sales, true),
            employers: selectedPump === "all" ? rawData.employers : rawData.employers.filter((e) => e.pumpId === selectedPump || e.pump === selectedPump),
            pumps: selectedPump === "all" ? rawData.pumps : rawData.pumps.filter((p) => p.pumpId === selectedPump || p.location === selectedPump),
            expenses: filterByPumpAndDate(rawData.expenses),
            stocks: selectedPump === "all" ? rawData.stocks : rawData.stocks.filter((s) => s.pumpId === selectedPump || s.location === selectedPump),
            credits: filterByPumpAndDate(rawData.credits),
        };
    };

    const filteredData = getFilteredData();

    // Calculate overview metrics
    const calculateOverviewMetrics = () => {
        const totalRevenue = filteredData.sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
        const totalOrders = filteredData.sales.length;
        const totalExpenses = filteredData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalProfit = filteredData.sales.reduce((sum, sale) => sum + sale.totalProfit, 0);

        return {
            totalRevenue,
            totalOrders,
            totalExpenses,
            totalProfit,
            totalPumps: filteredData.pumps.length,
            fuelStock: filteredData.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
            totalEmployers: filteredData.employers.length,
            activePumps: filteredData.pumps.filter((p) => p.status.toLowerCase() === "active").length,
        };
    };

    const overviewMetrics = calculateOverviewMetrics();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6" suppressHydrationWarning>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Comprehensive business insights and reports</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center flex-wrap">
                <Select value={selectedPump} onValueChange={setSelectedPump}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Pump" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Pumps</SelectItem>
                        {pumpsList.map((pump, idx) => (
                            <SelectItem key={idx} value={pump}>
                                {pump}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <DatePicker
                        selected={fromDate}
                        onChange={(date) => setFromDate(date || undefined)}
                        dateFormat="MMM dd, yyyy"
                        placeholderText="From Date"
                        className="bg-transparent outline-none text-sm w-[140px]"
                    />
                </div>

                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <DatePicker
                        selected={toDate}
                        onChange={(date) => setToDate(date || undefined)}
                        dateFormat="MMM dd, yyyy"
                        placeholderText="To Date"
                        minDate={fromDate || undefined}
                        className="bg-transparent outline-none text-sm w-[140px]"
                    />
                </div>

                <Button
                    variant="outline"
                    onClick={() => {
                        const todayStart = new Date();
                        todayStart.setHours(0, 0, 0, 0);
                        const todayEnd = new Date();
                        todayEnd.setHours(23, 59, 59, 999);
                        setFromDate(todayStart);
                        setToDate(todayEnd);
                    }}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                >
                    Today&apos;s Data
                </Button>

                <Button
                    variant="ghost"
                    onClick={() => {
                        setSelectedPump("all");
                        setFromDate(undefined);
                        setToDate(undefined);
                    }}
                >
                    Reset Filters
                </Button>
            </div>

            {/* Tabs with Report Components */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="employer">Employer</TabsTrigger>
                    <TabsTrigger value="pumps">Pumps</TabsTrigger>
                    <TabsTrigger value="expense">Expense</TabsTrigger>
                    <TabsTrigger value="stocks">Stocks</TabsTrigger>
                    <TabsTrigger value="credits">Credits</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <OverviewReport
                        metrics={overviewMetrics}
                        salesData={filteredData.sales}
                        expensesData={filteredData.expenses}
                    />
                </TabsContent>

                <TabsContent value="sales">
                    <SalesReport salesData={filteredData.sales} />
                </TabsContent>

                <TabsContent value="employer">
                    <EmployerReport
                        employersData={filteredData.employers}
                        salesData={filteredData.sales}
                    />
                </TabsContent>

                <TabsContent value="pumps">
                    <PumpsReport
                        pumpsData={filteredData.pumps}
                        salesData={filteredData.sales}
                    />
                </TabsContent>

                <TabsContent value="expense">
                    <ExpenseReport expensesData={filteredData.expenses} totalRevenue={overviewMetrics.totalRevenue} />
                </TabsContent>

                <TabsContent value="stocks">
                    <StocksReport stocksData={filteredData.stocks} />
                </TabsContent>

                <TabsContent value="credits">
                    <CreditsReport creditsData={filteredData.credits} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
