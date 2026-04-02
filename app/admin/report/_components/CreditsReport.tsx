"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";

import { CreditItem } from "./types";

interface CreditsReportProps {
  creditsData: CreditItem[];
}

export function CreditsReport({ creditsData }: CreditsReportProps) {
  // Calculate metrics
  const totalCreditAmount = creditsData.reduce((sum, credit) => sum + credit.creditAmount, 0);
  const totalSalesAmountWithCredit = creditsData.reduce((sum, credit) => sum + credit.totalSaleAmount, 0);

  // Calculate unique customers with credit
  const uniqueCustomers = new Set(creditsData.map(c => c.customerPhone)).size;

  const generateCreditsPDF = () => {
    const formatCurrency = (amount: number) => {
      return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Credits Report</title>
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
          .metric-value.negative-balance { color: #dc2626; }
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
          .badge-warning { background: #fef3c7; color: #d97706; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">⛽ Fuel POS Credits Report</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>

        <div class="section">
          <div class="section-title">📊 Credits Summary</div>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">💰 Total Outstanding Credit</div>
              <div class="metric-value negative-balance">${formatCurrency(totalCreditAmount)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">👥 Customers with Credit</div>
              <div class="metric-value">${uniqueCustomers}</div>
            </div>
            <div class="metric">
              <div class="metric-label">🛒 Orders Included</div>
              <div class="metric-value">${creditsData.length}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 Outstanding Credits</div>
          <table>
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Pump</th>
                <th>Sale Total</th>
                <th>Pending Credit</th>
              </tr>
            </thead>
            <tbody>
              ${creditsData.slice(0, 100).map(credit => `
                <tr>
                  <td>${credit.saleId}</td>
                  <td>${format(new Date(credit.date), "MMM dd, yyyy")}</td>
                  <td style="font-weight: 500;">${credit.customerName}</td>
                  <td>${credit.customerPhone || 'N/A'}</td>
                  <td>${credit.pump}</td>
                  <td>${formatCurrency(credit.totalSaleAmount)}</td>
                  <td style="color: #dc2626; font-weight: 600;">${formatCurrency(credit.creditAmount)}</td>
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
            <CardTitle className="text-sm font-medium">Total Outstanding Credit</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₨ {totalCreditAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total pending payments from all sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers w/ Credit</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground">Distinct customers on selected date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Affected Sales Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₨ {totalSalesAmountWithCredit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Gross total of orders with incomplete payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Credits Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Credits Details</CardTitle>
          <Button variant="outline" size="sm" onClick={generateCreditsPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Pump</TableHead>
                <TableHead>Sale Total</TableHead>
                <TableHead>Credit Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground border-b-0 py-8">
                    No pending credit data found
                  </TableCell>
                </TableRow>
              ) : (
                creditsData.map((credit, idx) => (
                  <TableRow key={`${credit.saleId}-${idx}`}>
                    <TableCell className="font-medium">{credit.saleId}</TableCell>
                    <TableCell>{format(new Date(credit.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-medium">{credit.customerName}</TableCell>
                    <TableCell>{credit.customerPhone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{credit.pump}</Badge>
                    </TableCell>
                    <TableCell>₨ {credit.totalSaleAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-destructive font-semibold">₨ {credit.creditAmount.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
