"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Receipt, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { EXPENSE_TYPES } from "@/validators/expense";

interface Expense {
  id: string; // Display ID (e.g. from DB _id or mapped)
  _id: string; // Real DB ID
  name: string;
  type: string;
  amount: number;
  pump: string;
  date: string;
  notes: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPump, setSelectedPump] = useState("all");
  const [fuelPumps, setFuelPumps] = useState<string[]>([]);

  // Fetch Data
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true);
        // 1. Fetch Expenses
        const expenseRes = await fetch("/api/expenses");
        if (expenseRes.ok) {
          const data = await expenseRes.json();
          const mappedData = data.map((exp: any) => ({
            id: exp._id.substring(0, 6).toUpperCase(), // Simulating a short ID
            _id: exp._id,
            name: exp.expenseTitle,
            type: exp.expenseType,
            amount: exp.amount,
            pump: exp.pump,
            date: exp.date,
            notes: exp.notes || "—"
          }));
          setExpenses(mappedData);
        }

        // 2. Fetch Pumps for filter
        const pumpsRes = await fetch("/api/fuel-pumps");
        if (pumpsRes.ok) {
          const pumpsData = await pumpsRes.json();
          setFuelPumps(pumpsData.map((p: any) => p.pumpName));
        }

      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, []);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        searchQuery === "" ||
        expense.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || expense.type === selectedType;
      const matchesPump = selectedPump === "all" || expense.pump === selectedPump;
      return matchesSearch && matchesType && matchesPump;
    });
  }, [searchQuery, selectedType, selectedPump, expenses]);

  // Calculate summary metrics
  const totalExpenses = expenses.length;
  // Calculate today based on local time matching the stored date string format (YYYY-MM-DD from API if mapped correctly)
  // API returns ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ). We need to extract YYYY-MM-DD.
  const today = new Date().toISOString().split("T")[0];
  const todayExpenses = expenses.filter((exp) => exp.date.startsWith(today)).length;
  const totalAmountSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border shadow-sm rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-2">
              <Receipt className="h-6 w-6 text-[#14b8a6]" />
            </div>
            <p className="text-sm text-[#64748b]">Total Expenses</p>
            <p className="text-2xl font-bold text-[#020617]">{totalExpenses}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-[#06b6d4]" />
            </div>
            <p className="text-sm text-[#64748b]">Today&apos;s Expenses</p>
            <p className="text-2xl font-bold text-[#020617]">{todayExpenses}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-2">
              <DollarSign className="h-6 w-6 text-[#22c55e]" />
            </div>
            <p className="text-sm text-[#64748b]">Total Amount Spent</p>
            <p className="text-2xl font-bold text-[#020617]">
              Rs. {totalAmountSpent.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters + Add Button */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748b]" />
            <Input
              placeholder="Search expense by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-md"
            />
          </div>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px] rounded-md">
              <SelectValue placeholder="Expense Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {EXPENSE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPump} onValueChange={setSelectedPump}>
            <SelectTrigger className="w-[160px] rounded-md">
              <SelectValue placeholder="Pump / Shop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pumps</SelectItem>
              {fuelPumps.map((pump) => (
                <SelectItem key={pump} value={pump}>{pump}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Link href="/admin/expenses/add" className="w-full sm:w-auto">
          <Button className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Expense Table */}
      <Card className="overflow-hidden bg-white shadow-sm border rounded-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="text-xs text-[#64748b]">Expense ID</TableHead>
                <TableHead className="text-xs text-[#64748b]">Name / Title</TableHead>
                <TableHead className="text-xs text-[#64748b]">Type</TableHead>
                <TableHead className="text-xs text-[#64748b]">Pump / Shop</TableHead>
                <TableHead className="text-xs text-[#64748b]">Amount (Rs.)</TableHead>
                <TableHead className="text-xs text-[#64748b]">Date</TableHead>
                <TableHead className="text-xs text-[#64748b]">Notes</TableHead>
                <TableHead className="text-xs text-[#64748b]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#14b8a6]" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-[#64748b]"
                  >
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow
                    key={expense._id}
                    className="hover:bg-gray-50 border-b"
                  >
                    <TableCell className="text-sm font-medium text-[#020617]">
                      {expense.id}
                    </TableCell>
                    <TableCell className="text-sm text-[#020617]">
                      {expense.name}
                    </TableCell>
                    <TableCell className="text-sm text-[#020617]">
                      {expense.type}
                    </TableCell>
                    <TableCell className="text-sm text-[#020617]">
                      {expense.pump}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-[#020617]">
                      {expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-[#64748b]">
                      {new Date(expense.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-[#64748b] max-w-[200px] truncate">
                      {expense.notes}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/expenses/${expense._id}/view`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-md"
                        >
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Expenses;
