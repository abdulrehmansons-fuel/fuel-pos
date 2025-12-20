"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Users, UserCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Employer {
  id: string; // Display ID (EMP-XXX)
  _id: string; // Database ID
  name: string;
  username: string;
  email: string;
  phone: string;
  salary: number;
  fuelPump: string;
  status: "Active" | "Inactive";
}

const Employers = () => {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pumpFilter, setPumpFilter] = useState("All");
  const [fuelPumps, setFuelPumps] = useState<string[]>([]);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true);
        // 1. Fetch Employers
        const res = await fetch("/api/employers");
        if (res.ok) {
          const data = await res.json();
          // Map API data to UI interface
          const mappedData = data.map((emp: { employerId: string; _id: string; fullName: string; username: string; email: string; mobile: string; monthlySalary: number; fuelPump: string; status: "Active" | "Inactive" }) => ({
            id: emp.employerId || emp._id, // Use custom ID if available, else fallback
            _id: emp._id, // Keep real _id for links
            name: emp.fullName,
            username: emp.username,
            email: emp.email,
            phone: emp.mobile,
            salary: emp.monthlySalary,
            fuelPump: emp.fuelPump,
            status: emp.status,
          }));
          setEmployers(mappedData);
        }

        // 2. Fetch Fuel Pumps for Filter
        const pumpsRes = await fetch("/api/fuel-pumps");
        if (pumpsRes.ok) {
          const pumpsData = await pumpsRes.json();
          setFuelPumps(pumpsData.map((p: { pumpName: string }) => p.pumpName));
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMethods();
  }, []);

  const totalEmployers = employers.length;
  const activeEmployers = employers.filter((e) => e.status.toLowerCase() === "active").length;
  const inactiveEmployers = employers.filter((e) => e.status.toLowerCase() === "inactive").length;

  const filteredEmployers = employers.filter((employer) => {
    const matchesSearch =
      employer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employer.username.toLowerCase().includes(searchQuery.toLowerCase()); // Added username to search

    const matchesStatus = statusFilter === "All" || employer.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPump = pumpFilter === "All" || employer.fuelPump === pumpFilter;

    return matchesSearch && matchesStatus && matchesPump;
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <div className="container mx-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border shadow-sm rounded-xl">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-2">
                <Users className="h-6 w-6 text-[#14b8a6]" />
              </div>
              <p className="text-sm text-[#64748b]">Total Employers</p>
              <p className="text-2xl font-bold text-[#020617]">{totalEmployers}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm rounded-xl">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-2">
                <UserCheck className="h-6 w-6 text-[#22c55e]" />
              </div>
              <p className="text-sm text-[#64748b]">Active Employers</p>
              <p className="text-2xl font-bold text-[#020617]">{activeEmployers}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm rounded-xl">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-2">
                <UserX className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-[#64748b]">Inactive Employers</p>
              <p className="text-2xl font-bold text-[#020617]">{inactiveEmployers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filters, and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748b]" />
              <Input
                placeholder="Search employer by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-md"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-md">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pumpFilter} onValueChange={setPumpFilter}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-md">
                <SelectValue placeholder="Fuel Pump" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Pumps</SelectItem>
                {fuelPumps.map((pump) => (
                  <SelectItem key={pump} value={pump}>
                    {pump}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Link href="/admin/employers/add" className="w-full sm:w-auto">
            <Button className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Employer
            </Button>
          </Link>
        </div>

        {/* Employer Table */}
        <Card className="rounded-xl border shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs text-[#64748b] font-semibold">Employer ID</TableHead>
                  <TableHead className="text-xs text-[#64748b] font-semibold">Name</TableHead>
                  <TableHead className="text-xs text-[#64748b] font-semibold">Username</TableHead> {/* Added Username header */}
                  <TableHead className="text-xs text-[#64748b] font-semibold">Email</TableHead>
                  <TableHead className="text-xs text-[#64748b] font-semibold">Phone Number</TableHead>
                  <TableHead className="text-xs text-[#64748b] font-semibold">Salary (Rs.)</TableHead>
                  <TableHead className="text-xs text-[#64748b] font-semibold">Fuel Pump</TableHead>
                  <TableHead className="text-xs text-[#64748b] font-semibold">Status</TableHead>
                  <TableHead className="text-xs text-[#64748b] font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b8a6]"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployers.length > 0 ? (
                  filteredEmployers.map((employer) => (
                    <TableRow key={employer._id} className="hover:bg-gray-100">
                      <TableCell className="text-sm text-[#020617] font-medium">{employer.id.slice(-6).toUpperCase()}</TableCell>
                      <TableCell className="text-sm text-[#020617]">{employer.name}</TableCell>
                      <TableCell className="text-sm text-[#020617] font-semibold">{employer.username || "—"}</TableCell>
                      <TableCell className="text-sm text-[#64748b]">{employer.email}</TableCell>
                      <TableCell className="text-sm text-[#64748b]">{employer.phone}</TableCell>
                      <TableCell className="text-sm text-[#020617] font-medium">
                        {employer.salary.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-[#64748b]">{employer.fuelPump}</TableCell>
                      <TableCell>
                        <Badge
                          variant={employer.status.toLowerCase() === "active" ? "default" : "secondary"}
                          className={
                            employer.status.toLowerCase() === "active"
                              ? "bg-[#14b8a6]/10 text-[#14b8a6] hover:bg-[#14b8a6]/10"
                              : "bg-red-100 text-red-600 hover:bg-red-100"
                          }
                        >
                          {employer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/employers/${employer._id}/view`}>
                          <Button variant="outline" size="sm" className="rounded-md">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-[#64748b] py-8">
                      No employers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Employers;
