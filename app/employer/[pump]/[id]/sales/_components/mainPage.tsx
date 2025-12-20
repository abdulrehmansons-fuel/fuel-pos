"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Search, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

interface Sale {
    _id: string;
    items: Array<{
        productName: string;
        quantity: number;
        unit: string;
    }>;
    grandTotal: number;
    amountPaid: number;
    paymentMethod: string;
    paymentStatus: "Paid" | "Partial" | "Overpaid";
    status: "Pending" | "Approved" | "Rejected";
    createdAt: string;
}

const getStatusBadge = (status: "Pending" | "Approved" | "Rejected") => {
    const styles = {
        Pending: "bg-yellow-100 text-yellow-700",
        Approved: "bg-green-100 text-[#22c55e]",
        Rejected: "bg-red-100 text-[#dc2626]",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
            {status}
        </span>
    );
};

export default function EmployerSalesList() {
    const router = useRouter();
    const params = useParams();
    const pumpId = params?.pump as string;
    const employerId = params?.id as string;

    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const fetchSales = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/sales?employerId=${employerId}`);
                if (!response.ok) throw new Error("Failed to fetch sales");
                const data = await response.json();
                setSales(data);
            } catch (error) {
                console.error("Error fetching sales:", error);
            } finally {
                setLoading(false);
            }
        };

        if (employerId) {
            fetchSales();
        }
    }, [employerId]);

    const filteredSales = sales.filter((sale) => {
        const products = sale.items.map((item) => item.productName).join(", ");
        const matchesSearch =
            sale._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            products.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || sale.status.toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalSales = sales.length;
    const approvedSales = sales.filter((s) => s.status === "Approved").length;
    const pendingSales = sales.filter((s) => s.status === "Pending").length;

    return (
        <div className="min-h-screen bg-[#f1f5f9]">
            <div className="p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-white rounded-xl border shadow-sm">
                        <div className="p-6 text-center">
                            <div className="flex justify-center mb-2">
                                <DollarSign className="h-6 w-6 text-[#14b8a6]" />
                            </div>
                            <p className="text-sm text-[#64748b]">Total Sales</p>
                            <p className="text-2xl font-bold text-[#020617]">{totalSales}</p>
                        </div>
                    </Card>
                    <Card className="bg-white rounded-xl border shadow-sm">
                        <div className="p-6 text-center">
                            <div className="flex justify-center mb-2">
                                <CheckCircle className="h-6 w-6 text-[#22c55e]" />
                            </div>
                            <p className="text-sm text-[#64748b]">Approved Sales</p>
                            <p className="text-2xl font-bold text-[#020617]">{approvedSales}</p>
                        </div>
                    </Card>
                    <Card className="bg-white rounded-xl border shadow-sm">
                        <div className="p-6 text-center">
                            <div className="flex justify-center mb-2">
                                <Clock className="h-6 w-6 text-yellow-500" />
                            </div>
                            <p className="text-sm text-[#64748b]">Pending Sales</p>
                            <p className="text-2xl font-bold text-[#020617]">{pendingSales}</p>
                        </div>
                    </Card>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                            <Input
                                placeholder="Search by Sale ID or Products"
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
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
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
                                <TableHead className="font-semibold text-[#020617] text-center">Quantity (L)</TableHead>
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
                                    <TableCell colSpan={9} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center">
                                            <Spinner className="h-8 w-8 text-[#14b8a6] mb-2" />
                                            <p className="text-[#64748b]">Loading sales...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12">
                                        <p className="text-[#64748b]">No sales found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSales.map((sale) => {
                                    const totalLiters = sale.items.reduce((sum: number, item: { unit: string; quantity: number }) => {
                                        const liters = item.unit === "L" ? item.quantity : item.unit === "mL" ? item.quantity / 1000 : 0;
                                        return sum + liters;
                                    }, 0);

                                    return (
                                        <TableRow key={sale._id} className="hover:bg-gray-100">
                                            <TableCell className="font-medium text-[#020617]">
                                                SALE-{sale._id.slice(-6).toUpperCase()}
                                            </TableCell>
                                            <TableCell className="text-[#020617] max-w-[200px]">
                                                {sale.items.map((item: { productName: string }) => item.productName).join(", ")}
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-[#020617]">
                                                {totalLiters.toFixed(2)} L
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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.push(`/employer/${pumpId}/${employerId}/sales/${sale._id}/view`)}
                                                        className="h-8 px-3"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}