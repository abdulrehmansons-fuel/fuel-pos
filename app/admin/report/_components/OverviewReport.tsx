"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Package, Users, Fuel, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

import { SalesItem, ExpenseItem } from "./types";

interface OverviewReportProps {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    totalProfit: number;
    totalExpenses: number;
    totalPumps: number;
    fuelStock: number;
    totalEmployers: number;
    activePumps: number;
  };
  salesData: SalesItem[];
  expensesData: ExpenseItem[];
}

export function OverviewReport({ metrics, salesData, expensesData }: OverviewReportProps) {
  // Prepare chart data
  const prepareChartData = () => {
    const groupedByDate: Record<string, { revenue: number; expenses: number }> = {};

    // Group Sales
    salesData.forEach((sale) => {
      const date = format(new Date(sale.date), "MMM dd");
      if (!groupedByDate[date]) {
        groupedByDate[date] = { revenue: 0, expenses: 0 };
      }
      groupedByDate[date].revenue += sale.totalPrice;
    });

    // Group Expenses
    expensesData.forEach((expense) => {
      const date = format(new Date(expense.date), "MMM dd");
      if (!groupedByDate[date]) {
        groupedByDate[date] = { revenue: 0, expenses: 0 };
      }
      groupedByDate[date].expenses += expense.amount;
    });

    return Object.entries(groupedByDate)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()) // Attempt to sort by date
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
      }));
  };

  const revenueVsExpenses = prepareChartData();

  const salesTrend = salesData.slice(0, 10).map((sale) => ({
    date: format(new Date(sale.date), "MMM dd"),
    sales: sale.totalPrice,
  }));

  const generateOverviewPDF = () => {
    const formatCurrency = (amount: number) => {
      return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Overview Report</title>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #fff;
            color: #333;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding: 20px;
            background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
            color: white;
            border-radius: 12px;
          }
          .title { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 8px;
          }
          .subtitle { 
            font-size: 16px; 
            opacity: 0.9;
          }
          .section { 
            margin: 30px 0; 
            background: #fafafa;
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }
          .section-title { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 20px; 
            color: #1f2937;
            border-bottom: 3px solid #14b8a6;
            padding-bottom: 8px;
          }
          .metrics { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
          }
          .metric { 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .metric-label { 
            font-size: 13px; 
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .metric-value { 
            font-size: 24px; 
            font-weight: 700;
            color: #1e293b;
          }
          .metric-value.positive { color: #14b8a6; }
          .metric-value.negative { color: #dc2626; }
          .summary { 
            background: #f0fdfa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #14b8a6;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .summary-item:last-child {
            border-bottom: none;
            font-weight: 700;
            font-size: 18px;
            background: #14b8a6;
            color: white;
            padding: 15px;
            border-radius: 6px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">⛽ Fuel POS Overview Report</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>

        <div class="section">
          <div class="section-title">📊 Business Metrics</div>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">💰 Total Revenue</div>
              <div class="metric-value positive">${formatCurrency(metrics.totalRevenue)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">🛒 Total Orders</div>
              <div class="metric-value">${metrics.totalOrders}</div>
            </div>
            <div class="metric">
              <div class="metric-label">📈 Total Profit</div>
              <div class="metric-value ${metrics.totalProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(metrics.totalProfit)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">💸 Total Expenses</div>
              <div class="metric-value negative">${formatCurrency(metrics.totalExpenses)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🏢 Operational Metrics</div>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">⛽ Total Pumps</div>
              <div class="metric-value">${metrics.totalPumps}</div>
            </div>
            <div class="metric">
              <div class="metric-label">✅ Active Pumps</div>
              <div class="metric-value positive">${metrics.activePumps}</div>
            </div>
            <div class="metric">
              <div class="metric-label">📦 Fuel Stock (L)</div>
              <div class="metric-value">${metrics.fuelStock.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">👥 Employees</div>
              <div class="metric-value">${metrics.totalEmployers}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">💼 Financial Summary</div>
          <div class="summary">
            <div class="summary-item">
              <span>Total Revenue</span>
              <span class="metric-value positive">${formatCurrency(metrics.totalRevenue)}</span>
            </div>
            <div class="summary-item">
              <span>Total Expenses</span>
              <span class="metric-value negative">${formatCurrency(metrics.totalExpenses)}</span>
            </div>
            <div class="summary-item">
              <span>Net Profit</span>
              <span>${formatCurrency(metrics.totalProfit)}</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₨ {metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{metrics.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalProfit >= 0 ? 'text-success' : 'text-red-600'}`}>
              ₨ {metrics.totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₨ {metrics.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Operating costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pumps</CardTitle>
            <Fuel className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metrics.totalPumps}</div>
            <p className="text-xs text-muted-foreground">All pumps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pumps</CardTitle>
            <Fuel className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metrics.activePumps}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Stock</CardTitle>
            <Package className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{metrics.fuelStock.toLocaleString()} L</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metrics.totalEmployers}</div>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#14b8a6" name="Revenue" />
                <Bar dataKey="expenses" fill="#dc2626" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#14b8a6" strokeWidth={2} name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Financial Summary</CardTitle>
          <Button variant="outline" size="sm" onClick={generateOverviewPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Total Revenue</span>
              <span className="text-primary font-bold">₨ {metrics.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Total Expenses</span>
              <span className="text-red-600 font-bold">₨ {metrics.totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 bg-primary/10 p-3 rounded-lg">
              <span className="font-bold text-lg">Net Profit</span>
              <span className={`font-bold text-lg ${metrics.totalProfit >= 0 ? 'text-success' : 'text-red-600'}`}>
                ₨ {metrics.totalProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
