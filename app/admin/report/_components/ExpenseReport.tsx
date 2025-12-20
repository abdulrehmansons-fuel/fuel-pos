"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, Receipt, Download } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const COLORS = ['#14b8a6', '#06b6d4', '#0d9488', '#22d3ee', '#5eead4', '#2dd4bf'];

import { ExpenseItem } from "./types";

interface ExpenseReportProps {
  expensesData: ExpenseItem[];
  totalRevenue: number;
}

export function ExpenseReport({ expensesData, totalRevenue }: ExpenseReportProps) {
  // Calculate metrics
  const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const costOfGoodsSold = Math.floor(totalRevenue * 0.6); // Mock COGS

  // Prepare chart data
  const expenseTrendData = expensesData.slice(0, 10).map((expense) => ({
    date: format(new Date(expense.date), "MMM dd"),
    amount: expense.amount,
  }));

  const expenseByTypeData = expensesData.reduce((acc: { type: string; amount: number }[], expense) => {
    const existing = acc.find((item) => item.type === expense.category);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({ type: expense.category, amount: expense.amount });
    }
    return acc;
  }, []);

  const generateExpensesPDF = () => {
    const formatCurrency = (amount: number) => {
      return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expenses Report</title>
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
          .badge-expense { background: #fee2e2; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">⛽ Fuel POS Expenses Report</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>

        <div class="section">
          <div class="section-title">💰 Financial Summary</div>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">📊 Total Revenue</div>
              <div class="metric-value positive">${formatCurrency(totalRevenue)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">💸 Total Expenses</div>
              <div class="metric-value negative">${formatCurrency(totalExpenses)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">📈 Gross Profit</div>
              <div class="metric-value ${totalProfit >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(totalProfit)}
              </div>
            </div>
            <div class="metric">
              <div class="metric-label">📦 Cost of Goods Sold</div>
              <div class="metric-value">${formatCurrency(costOfGoodsSold)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 Expense Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              ${expensesData.slice(0, 50).map(expense => `
                <tr>
                  <td>${format(new Date(expense.date), "MMM dd, yyyy")}</td>
                  <td>
                    <span class="badge badge-expense">${expense.category}</span>
                  </td>
                  <td>${expense.description || '-'}</td>
                  <td>${formatCurrency(expense.amount)}</td>
                  <td>${expense.location}</td>
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₨ {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₨ {totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Operating costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
              ₨ {totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₨ {costOfGoodsSold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Fuel costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByTypeData}
                  dataKey="amount"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {expenseByTypeData.map((_: { type: string; amount: number }, index: number) => (
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

      {/* Expenses Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expense Details</CardTitle>
          <Button variant="outline" size="sm" onClick={generateExpensesPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expensesData.map((expense: ExpenseItem, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{expense.category}</Badge>
                  </TableCell>
                  <TableCell>{expense.description || '-'}</TableCell>
                  <TableCell>₨ {expense.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.location}</Badge>
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
