"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, Activity, AlertTriangle, TrendingUp, Download } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const COLORS = ['#14b8a6', '#06b6d4', '#0d9488', '#22d3ee'];

import { PumpItem, SalesItem } from "./types";

interface PumpsReportProps {
  pumpsData: PumpItem[];
  salesData: SalesItem[];
}

export function PumpsReport({ pumpsData, salesData }: PumpsReportProps) {
  // Calculate real dispensed fuel for each pump
  const pumpMetrics = pumpsData.map(pump => {
    const totalDispensed = salesData
      .filter(s => s.pump === pump.location || s.pumpId === pump.pumpId)
      .reduce((sum, s) => sum + s.quantity, 0);

    return {
      ...pump,
      totalDispensed
    };
  });

  // Calculate metrics
  const totalPumps = pumpMetrics.length;
  const activePumps = pumpMetrics.filter((p) => p.status === "active").length;
  const maintenanceRequired = pumpMetrics.filter((p) => p.status === "Maintenance").length;
  const totalFuelDispensed = pumpMetrics.reduce((sum, pump) => sum + pump.totalDispensed, 0);

  // Prepare chart data
  const fuelByPump = pumpMetrics.map((pump) => ({
    name: pump.location,
    dispensed: pump.totalDispensed,
  }));

  const statusDistribution = [
    { name: "Active", value: activePumps },
    { name: "Maintenance", value: maintenanceRequired },
  ];

  const generatePumpsPDF = () => {
    const formatNumber = (num: number) => num.toLocaleString('en-PK');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pumps Report</title>
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
          .badge-active { background: #dcfce7; color: #16a34a; }
          .badge-maintenance { background: #fef3c7; color: #f59e0b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">⛽ Fuel POS Pumps Report</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>

        <div class="section">
          <div class="section-title">⛽ Pump Metrics</div>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">⛽ Total Pumps</div>
              <div class="metric-value">${totalPumps}</div>
            </div>
            <div class="metric">
              <div class="metric-label">✅ Active Pumps</div>
              <div class="metric-value success">${activePumps}</div>
            </div>
            <div class="metric">
              <div class="metric-label">⚠️ Maintenance Required</div>
              <div class="metric-value warning">${maintenanceRequired}</div>
            </div>
            <div class="metric">
              <div class="metric-label">📊 Total Fuel Dispensed</div>
              <div class="metric-value">${formatNumber(totalFuelDispensed)} L</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 Pump Details</div>
          <table>
            <thead>
              <tr>
                <th>Pump ID</th>
                <th>Location</th>
                <th>Fuel Type</th>
                <th>Status</th>
                <th>Last Maintenance</th>
                <th>Total Dispensed</th>
              </tr>
            </thead>
            <tbody>
              ${pumpsData.map(pump => `
                <tr>
                  <td><strong>${pump.pumpId}</strong></td>
                  <td>${pump.location}</td>
                  <td>${pump.fuelType}</td>
                  <td>
                    <span class="badge ${pump.status === 'Active' ? 'badge-active' : 'badge-maintenance'}">
                      ${pump.status}
                    </span>
                  </td>
                  <td>${format(new Date(pump.lastMaintenance), "MMM dd, yyyy")}</td>
                  <td>${formatNumber(pump.totalDispensed)} L</td>
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
            <CardTitle className="text-sm font-medium">Total Pumps</CardTitle>
            <Fuel className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalPumps}</div>
            <p className="text-xs text-muted-foreground">All pumps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pumps</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activePumps}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Required</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{maintenanceRequired}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Dispensed</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{totalFuelDispensed.toLocaleString()} L</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fuel Dispensed by Pump</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fuelByPump}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="dispensed" fill="#14b8a6" name="Fuel Dispensed (L)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pump Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {statusDistribution.map((_: { name: string; value: number }, index: number) => (
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

      {/* Pumps Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pump Details</CardTitle>
          <Button variant="outline" size="sm" onClick={generatePumpsPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pump ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Total Dispensed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pumpMetrics.map((pump: PumpItem, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{pump.pumpId}</TableCell>
                  <TableCell>{pump.location}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{pump.fuelType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pump.status === "Active" ? "default" : "secondary"}>
                      {pump.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(pump.lastMaintenance), "MMM dd, yyyy")}</TableCell>
                  <TableCell>{pump.totalDispensed.toLocaleString()} L</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
