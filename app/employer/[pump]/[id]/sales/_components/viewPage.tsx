"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface SaleItem {
    productName: string;
    category: string;
    quantity: number;
    unit: string;
    rate: number;
    total: number;
}

interface PaymentLog {
    action: string;
    amount: number;
    paymentMethod: string;
    performedBy: string;
    notes?: string;
    timestamp: string;
}

interface Sale {
    _id: string;
    employerId: {
        fullName: string;
        email: string;
    };
    pumpId: {
        pumpName: string;
        location: string;
    };
    items: SaleItem[];
    subtotal: number;
    tax: number;
    grandTotal: number;
    amountPaid: number;
    changeReturned: number;
    paymentStatus: string;
    paymentMethod: string;
    notes?: string;
    status: "Pending" | "Approved" | "Rejected";
    paymentHistory: PaymentLog[];
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

export default function EmployerSaleView() {
    const router = useRouter();
    const params = useParams();
    const pumpId = params?.pump as string;
    const employerId = params?.id as string;
    const saleId = params?.saleId as string;

    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSale = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/sales/${saleId}`);
                if (!response.ok) throw new Error("Failed to fetch sale");
                const data = await response.json();
                setSale(data);
            } catch (error) {
                console.error("Error fetching sale:", error);
            } finally {
                setLoading(false);
            }
        };

        if (saleId) {
            fetchSale();
        }
    }, [saleId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Spinner className="h-12 w-12 text-[#14b8a6] mb-4" />
                    <p className="text-[#64748b]">Loading sale details...</p>
                </div>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
                <p className="text-[#64748b]">Sale not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f1f5f9]">
            <main className="p-4 lg:p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/employer/${pumpId}/${employerId}/sales`)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-[#020617]">Sale Details</h1>
                            <p className="text-sm text-[#64748b]">SALE-{sale._id.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/employer/${pumpId}/${employerId}/sales/${saleId}/edit`)}
                        >
                            Edit Sale
                        </Button>
                        {getStatusBadge(sale.status)}
                    </div>
                </div>

                {/* Sale Info Card */}
                <Card className="p-6 bg-white border shadow-sm rounded-xl space-y-6">
                    {/* Basic Info Section */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#020617] mb-4 pb-2 border-b border-gray-100">
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[#64748b] mb-1">Sale ID</p>
                                <p className="text-sm font-semibold text-[#020617]">SALE-{sale._id.slice(-6).toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[#64748b] mb-1">Pump Name</p>
                                <p className="text-sm font-semibold text-[#020617]">
                                    {typeof sale.pumpId === 'object' && sale.pumpId?.pumpName ? sale.pumpId.pumpName : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[#64748b] mb-1">Employer</p>
                                <p className="text-sm font-semibold text-[#020617]">
                                    {typeof sale.employerId === 'object' && sale.employerId?.fullName ? sale.employerId.fullName : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[#64748b] mb-1">Payment Method</p>
                                <p className="text-sm font-semibold text-[#020617]">{sale.paymentMethod}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[#64748b] mb-1">Status</p>
                                {getStatusBadge(sale.status)}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[#64748b] mb-1">Created At</p>
                                <p className="text-sm font-semibold text-[#020617]">
                                    {new Date(sale.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sold Items Section */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#020617] mb-4 pb-2 border-b border-gray-100">
                            Sold Items
                        </h2>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="text-[#64748b]">Product / Fuel Type</TableHead>
                                    <TableHead className="text-center text-[#64748b]">Quantity</TableHead>
                                    <TableHead className="text-center text-[#64748b]">Rate (₨)</TableHead>
                                    <TableHead className="text-right text-[#64748b]">Total (₨)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-gray-50">
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-[#020617]">{item.productName}</p>
                                                <p className="text-xs text-[#64748b]">{item.category}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-[#020617]">
                                            {item.quantity} {item.unit}
                                        </TableCell>
                                        <TableCell className="text-center text-[#020617]">₨ {item.rate.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-medium text-[#020617]">₨ {item.total.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Bill Summary Section */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#020617] mb-4 pb-2 border-b border-gray-100">
                            Bill Summary
                        </h2>
                        <div className="max-w-xs ml-auto space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#64748b]">Subtotal</span>
                                <span className="text-[#020617]">₨ {sale.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#64748b]">Tax</span>
                                <span className="text-[#020617]">₨ {sale.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-lg font-semibold text-[#020617]">Grand Total</span>
                                <span className="text-xl font-bold text-[#14b8a6]">₨ {sale.grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#020617] mb-4 pb-2 border-b border-gray-100">
                            Notes
                        </h2>
                        <p className="text-sm text-[#64748b]">
                            {sale.notes || "—"}
                        </p>
                    </div>

                    {/* Payment Logs Section */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#020617] mb-4 pb-2 border-b border-gray-100">
                            Payment Logs
                        </h2>
                        <div className="space-y-4">
                            {sale.paymentHistory && sale.paymentHistory.length > 0 ? (
                                sale.paymentHistory.map((log, index) => (
                                    <div key={index} className="flex gap-4 relative">
                                        {/* Timeline line */}
                                        {index !== sale.paymentHistory.length - 1 && (
                                            <div className="absolute left-[19px] top-8 bottom-[-16px] w-[2px] bg-gray-100" />
                                        )}

                                        <div className="h-10 w-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                            <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                        </div>
                                        <div className="pt-2 w-full">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-[#020617]">{log.action}</p>
                                                    <p className="text-xs text-[#64748b] mt-0.5">by {log.performedBy}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-[#14b8a6]">
                                                        + ₨ {log.amount.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-[#64748b] mt-0.5">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-[#64748b]">No payment history yet</p>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-xs text-[#64748b] uppercase font-semibold">Remaining Balance</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-bold ${(sale.grandTotal - sale.amountPaid) > 0 ? "text-red-500" : "text-green-600"}`}>
                                        ₨ {(sale.grandTotal - sale.amountPaid).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
}