"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, AlertCircle, Download } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const COLORS = ['#14b8a6', '#06b6d4', '#0d9488', '#22d3ee', '#5eead4', '#2dd4bf'];

import { EmployerItem, SalesItem } from "./types";

interface EmployerReportProps {
  employersData: EmployerItem[];
  salesData: SalesItem[];
}

export function EmployerReport({ employersData, salesData }: EmployerReportProps) {
  // Calculate metrics
  const totalEmployers = employersData.length;
  const activeEmployers = employersData.filter((e) => e.status === "Active").length;
  const inactiveEmployers = employersData.filter((e) => e.status === "Inactive").length;

  // Calculate total unique shifts (days worked by any employer)
  const uniqueShifts = new Set(salesData.map(s => {
    const date = format(new Date(s.date), "yyyy-MM-dd");
    return `${date}-${s.pump}`; // Assuming pump-based shifts or similar
  })).size;

  const avgShifts = totalEmployers > 0 ? Math.round(uniqueShifts / totalEmployers) : 0;

  // Prepare chart data
  const employerDistribution = employersData.reduce((acc: { pump: string; count: number }[], emp) => {
    const existing = acc.find((item) => item.pump === emp.pump);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ pump: emp.pump, count: 1 });
    }
    return acc;
  }, []);

  const generateEmployersPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employers Report</title>
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
          .metric-value.warning { color: #dc2626; }
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
          .badge-active { background: #dcfce7; color: #16a34a; }
          .badge-inactive { background: #fee2e2; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">⛽ Fuel POS Employers Report</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>

        <div class="section">
          <div class="section-title">👥 Employer Metrics</div>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">👥 Total Employers</div>
              <div class="metric-value">${totalEmployers}</div>
            </div>
            <div class="metric">
              <div class="metric-label">✅ Active Employers</div>
              <div class="metric-value success">${activeEmployers}</div>
            </div>
            <div class="metric">
              <div class="metric-label">⚠️ Inactive Employers</div>
              <div class="metric-value warning">${inactiveEmployers}</div>
            </div>
            <div class="metric">
              <div class="metric-label">📊 Avg Shifts</div>
              <div class="metric-value">${avgShifts}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 Employer Details</div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Pump</th>
                <th>Role</th>
                <th>Email</th>
                <th>Date Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${employersData.slice(0, 50).map((emp: EmployerItem) => `
                <tr>
                  <td><strong>${emp.employerName}</strong></td>
                  <td>${emp.pump}</td>
                  <td>${emp.role}</td>
                  <td>${emp.email}</td>
                  <td>${format(new Date(emp.dateJoined), "MMM dd, yyyy")}</td>
                  <td>
                    <span class="badge ${emp.status === 'Active' ? 'badge-active' : 'badge-inactive'}">
                      ${emp.status}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employers</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{totalEmployers}</div>
            <p className="text-xs text-muted-foreground">All employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employers</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeEmployers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Employers</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveEmployers}</div>
            <p className="text-xs text-muted-foreground">Not active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Shifts</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{avgShifts}</div>
            <p className="text-xs text-muted-foreground">Per employer</p>
          </CardContent>
        </Card>
      </div>

      {/* Employer Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Employer Distribution by Pump</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={employerDistribution}
                dataKey="count"
                nameKey="pump"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {employerDistribution.map((_: { pump: string; count: number }, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Employers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employer Details</CardTitle>
          <Button variant="outline" size="sm" onClick={generateEmployersPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pump</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employersData.map((employer: EmployerItem, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{employer.employerName}</TableCell>
                  <TableCell>
                    <Badge>{employer.pump}</Badge>
                  </TableCell>
                  <TableCell>{employer.role}</TableCell>
                  <TableCell>{employer.email}</TableCell>
                  <TableCell>{format(new Date(employer.dateJoined), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant={employer.status === "Active" ? "default" : "destructive"}>
                      {employer.status}
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
