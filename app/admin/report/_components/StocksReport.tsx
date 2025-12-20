"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, DollarSign, TrendingUp, Download } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const COLORS = ['#14b8a6', '#06b6d4', '#0d9488', '#22d3ee'];

import { StockItem } from "./types";

interface StocksReportProps {
  stocksData: StockItem[];
}

export function StocksReport({ stocksData }: StocksReportProps) {
  // Calculate metrics
  const totalStockItems = stocksData.length;
  const lowStockItems = stocksData.filter((item) => item.quantity < 2000).length;
  const totalStockValue = stocksData.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const averageStockPrice = totalStockItems > 0 ? Math.round(totalStockValue / totalStockItems) : 0;

  // Prepare chart data
  const stockByFuelType = stocksData.map((stock) => ({
    name: stock.fuelType,
    quantity: stock.quantity,
  }));

  const stockDistribution = stocksData.map((stock) => ({
    name: stock.location,
    value: stock.quantity,
  }));

  const generateStocksPDF = () => {
    const formatCurrency = (amount: number) => {
      return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const formatNumber = (num: number) => num.toLocaleString('en-PK');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stocks Report</title>
        <meta charset="UTF-8">
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314b8a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 3h10v18H4z'/%3E%3Cpath d='M14 7h2a2 2 0 0 1 2 2v7'/%3E%3Cpath d='M9 17h6'/%3E%3C/svg%3E" />
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
          .metric-value.success { color: #14b8a6; }
          .metric-value.warning { color: #f59e0b; }
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
          .badge-stock { background: #dcfce7; color: #16a34a; }
          .badge-low { background: #fef3c7; color: #f59e0b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">⛽ Fuel POS Stocks Report</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>

        <div class="section">
          <div class="section-title">📦 Stock Metrics</div>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">📦 Total Stock Items</div>
              <div class="metric-value">${totalStockItems}</div>
            </div>
            <div class="metric">
              <div class="metric-label">⚠️ Low Stock Items</div>
              <div class="metric-value warning">${lowStockItems}</div>
            </div>
            <div class="metric">
              <div class="metric-label">💰 Total Stock Value</div>
              <div class="metric-value success">${formatCurrency(totalStockValue)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">📊 Avg Stock Price</div>
              <div class="metric-value">${formatCurrency(averageStockPrice)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 Stock Details</div>
          <table>
            <thead>
              <tr>
                <th>Fuel Type</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Location</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              ${stocksData.map(stock => `
                <tr>
                  <td><strong>${stock.fuelType}</strong></td>
                  <td>
                    <span class="badge ${stock.quantity >= 2000 ? 'badge-stock' : 'badge-low'}">
                      ${formatNumber(stock.quantity)} L
                    </span>
                  </td>
                  <td>${formatCurrency(stock.price)}/L</td>
                  <td>${stock.location}</td>
                  <td>${format(new Date(stock.lastUpdated), "MMM dd, yyyy")}</td>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalStockItems}</div>
            <p className="text-xs text-muted-foreground">Fuel types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Below 2000L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₨ {totalStockValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stock Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">₨ {averageStockPrice.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per item</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Quantity by Fuel Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockByFuelType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="#14b8a6" name="Quantity (L)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Distribution by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stockDistribution.map((_: { name: string; value: number }, index: number) => (
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

      {/* Stock Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock Details</CardTitle>
          <Button variant="outline" size="sm" onClick={generateStocksPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocksData.map((stock: StockItem, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{stock.fuelType}</TableCell>
                  <TableCell>
                    <Badge variant={stock.quantity >= 2000 ? "default" : "secondary"}>
                      {stock.quantity.toLocaleString()} L
                    </Badge>
                  </TableCell>
                  <TableCell>₨ {stock.price.toLocaleString()}/L</TableCell>
                  <TableCell>
                    <Badge variant="outline">{stock.location}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(stock.lastUpdated), "MMM dd, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
