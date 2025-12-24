"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, ShoppingCart, TrendingUp, Download } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const COLORS = ['#14b8a6', '#06b6d4', '#0d9488', '#22d3ee'];

import { SalesItem } from "./types";

interface SalesReportProps {
  salesData: SalesItem[];
}

export function SalesReport({ salesData }: SalesReportProps) {
  // Calculate metrics
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalProfit = salesData.reduce((sum, sale) => sum + sale.totalProfit, 0);
  const totalOrders = salesData.length;

  // Prepare chart data
  const salesTrendData = salesData.slice(0, 10).map((sale) => ({
    date: format(new Date(sale.date), "MMM dd"),
    sales: sale.totalPrice,
  }));

  const pumpRevenueData = salesData.reduce((acc: { name: string; revenue: number }[], sale) => {
    const existing = acc.find((item) => item.name === sale.pump);
    if (existing) {
      existing.revenue += sale.totalPrice;
    } else {
      acc.push({ name: sale.pump, revenue: sale.totalPrice });
    }
    return acc;
  }, []);

  const generateSalesPDF = () => {
    const formatCurrency = (amount: number) => {
      return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report</title>
        <meta charset="UTF-8">
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMTRiOGE2JyBzdHJva2Utd2lkdGg9JzInIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCc+PHBhdGggZD0nTTQgM2gxMHYxOEg0eicvPjxwYXRoIGQ9J00xNCA3aDJhMiAyIDAgMCAxIDIgMnY3Jy8+PHBhdGggZD0nTTkgMTdoNicvPjwvc3ZnPg==" />
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
          table { 
            width: 100%; 
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
          }
          th { 
            background: #f1f5f9;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            border-bottom: 2px solid #e2e8f0;
          }
          td { 
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:hover { background: #f8fafc; }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }
          .badge-success { background: #dcfce7; color: #16a34a; }
          .badge-danger { background: #fee2e2; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">⛽ Fuel POS Sales Report</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>

        <div class="section">
          <div class="section-title">📊 Sales Summary</div>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">💰 Total Revenue</div>
              <div class="metric-value positive">${formatCurrency(totalRevenue)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">📈 Total Profit</div>
              <div class="metric-value positive">${formatCurrency(totalProfit)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">🛒 Orders Completed</div>
              <div class="metric-value">${totalOrders}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 Sales Orders</div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Fuel Type</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Profit</th>
                <th>Pump</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${salesData.slice(0, 50).map(order => `
                <tr>
                  <td>${order.orderId}</td>
                  <td>${format(new Date(order.date), "MMM dd, yyyy")}</td>
                  <td>${order.fuelType}</td>
                  <td>${order.quantity} L</td>
                  <td>${formatCurrency(order.totalPrice)}</td>
                  <td style="color: #14b8a6; font-weight: 600;">${formatCurrency(order.totalProfit)}</td>
                  <td>${order.pump}</td>
                  <td>
                    <span class="badge ${order.status === 'Approved' ? 'badge-success' : 'badge-danger'}">
                      ${order.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₨ {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Completed</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₨ {totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sale - Purchase Price</p>
          </CardContent>
        </Card>

      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#14b8a6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Share by Pump</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pumpRevenueData}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pumpRevenueData.map((_: { name: string; revenue: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Orders</CardTitle>
          <Button variant="outline" size="sm" onClick={generateSalesPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Pump</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((order: SalesItem) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-medium">{order.orderId}</TableCell>
                  <TableCell>{format(new Date(order.date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>{order.fuelType}</TableCell>
                  <TableCell>{order.quantity} L</TableCell>
                  <TableCell>₨ {order.totalPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-success font-semibold">₨ {order.totalProfit.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.pump}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.status === "Approved" ? "default" : "destructive"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
