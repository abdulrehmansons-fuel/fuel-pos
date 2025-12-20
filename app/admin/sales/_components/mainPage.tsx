"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, Eye, Check, X, DollarSign, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Sale {
    _id: string;
    employerId: any;
    pumpId: any;
    items: any[];
    grandTotal: number;
    amountPaid: number;
    paymentMethod: string;
    status: "Pending" | "Approved" | "Rejected";
    createdAt: string;
}

const Sales = () => {
    const router = useRouter();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/sales");
            if (!response.ok) throw new Error("Failed to fetch sales");
            const data = await response.json();
            setSales(data);
        } catch (error) {
            console.error("Error fetching sales:", error);
            toast.error("Failed to load sales");
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter((sale) => {
        const employerName = typeof sale.employerId === 'object' ? sale.employerId?.fullName : "";
        const matchesSearch =
            sale._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (employerName && employerName.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalSales = sales.length;
    const approvedSales = sales.filter((s) => s.status === "Approved").length;
    const pendingSales = sales.filter((s) => s.status === "Pending").length;

    const getStatusBadge = (status: Sale["status"]) => {
        switch (status) {
            case "Pending":
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                        Pending
                    </span>
                );
            case "Approved":
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Approved
                    </span>
                );
            case "Rejected":
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600">
                        Rejected
                    </span>
                );
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const response = await fetch(`/api/sales/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Approved" }),
            });

            if (!response.ok) throw new Error("Failed to approve sale");

            toast.success("Sale approved successfully");
            fetchSales(); // Refresh the list
        } catch (error) {
            console.error("Error approving sale:", error);
            toast.error("Failed to approve sale");
        }
    };

    const handleReject = async (id: string) => {
        try {
            const response = await fetch(`/api/sales/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Rejected" }),
            });

            if (!response.ok) throw new Error("Failed to reject sale");

            toast.success("Sale rejected successfully");
            fetchSales(); // Refresh the list
        } catch (error) {
            console.error("Error rejecting sale:", error);
            toast.error("Failed to reject sale");
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9]">
            <div className="p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-white rounded-xl border shadow-sm">
                        <CardContent className="p-6 text-center">
                            <div className="flex justify-center mb-2">
                                <DollarSign className="h-6 w-6 text-[#14b8a6]" />
                            </div>
                            <p className="text-sm text-[#64748b]">Total Sales</p>
                            <p className="text-2xl font-bold text-[#020617]">{totalSales}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white rounded-xl border shadow-sm">
                        <CardContent className="p-6 text-center">
                            <div className="flex justify-center mb-2">
                                <CheckCircle className="h-6 w-6 text-[#22c55e]" />
                            </div>
                            <p className="text-sm text-[#64748b]">Approved Sales</p>
                            <p className="text-2xl font-bold text-[#020617]">{approvedSales}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white rounded-xl border shadow-sm">
                        <CardContent className="p-6 text-center">
                            <div className="flex justify-center mb-2">
                                <Clock className="h-6 w-6 text-yellow-500" />
                            </div>
                            <p className="text-sm text-[#64748b]">Pending Sales</p>
                            <p className="text-2xl font-bold text-[#020617]">{pendingSales}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                            <Input
                                placeholder="Search by Sale ID or Employer"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full sm:w-64 rounded-md"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-36 rounded-md">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Sales Table */}
                <Card className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="font-semibold text-[#020617]">Sale ID</TableHead>
                                <TableHead className="font-semibold text-[#020617]">Products</TableHead>
                                <TableHead className="font-semibold text-[#020617]">Pump</TableHead>
                                <TableHead className="font-semibold text-[#020617]">Employer</TableHead>
                                <TableHead className="font-semibold text-[#020617]">Amount (₨)</TableHead>
                                <TableHead className="font-semibold text-[#020617]">Remaining (₨)</TableHead>
                                <TableHead className="font-semibold text-[#020617]">Payment</TableHead>
                                <TableHead className="font-semibold text-[#020617]">Status</TableHead>
                                <TableHead className="font-semibold text-[#020617]">Sale Date & Time</TableHead>
                                <TableHead className="font-semibold text-[#020617] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b8a6] mb-2"></div>
                                            <p className="text-[#64748b]">Loading sales...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-12">
                                        <p className="text-[#64748b]">No sales found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSales.map((sale) => (
                                    <TableRow key={sale._id} className="hover:bg-gray-100">
                                        <TableCell className="font-medium text-[#020617]">
                                            SALE-{sale._id.slice(-6).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="text-[#020617] max-w-[200px] truncate">
                                            {sale.items.map((item: any) => item.productName).join(", ")}
                                        </TableCell>
                                        <TableCell className="text-[#020617]">
                                            {typeof sale.pumpId === 'object' && sale.pumpId?.pumpName ? sale.pumpId.pumpName : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-[#020617]">
                                            {typeof sale.employerId === 'object' && sale.employerId?.fullName ? sale.employerId.fullName : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-[#020617] font-medium">
                                            ₨ {sale.grandTotal.toLocaleString()}
                                        </TableCell>
                                        <TableCell className={`font-medium ${sale.grandTotal - sale.amountPaid > 0 ? "text-red-500" : "text-green-600"}`}>
                                            ₨ {(sale.grandTotal - sale.amountPaid).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-[#020617]">{sale.paymentMethod}</TableCell>
                                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                                        <TableCell className="text-[#64748b] text-sm">
                                            {new Date(sale.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                {sale.status === "Pending" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(sale._id)}
                                                            className="bg-[#22c55e] hover:bg-green-600 text-white h-8 px-3"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleReject(sale._id)}
                                                            className="bg-[#dc2626] hover:bg-red-700 text-white h-8 px-3"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => router.push(`/admin/sales/${sale._id}/view`)}
                                                    className="h-8 px-3"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
};

export default Sales;
