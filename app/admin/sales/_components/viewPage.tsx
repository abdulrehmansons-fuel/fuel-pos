"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    employerId: { fullName: string; email: string } | string;
    pumpId: { pumpName: string; location: string } | string;
    customerName?: string;
    customerPhone?: string;
    items: SaleItem[];
    subtotal: number;
    tax: number;
    grandTotal: number;
    amountPaid: number;
    changeReturned: number;
    paymentStatus: string;
    paymentMethod: string;
    paymentHistory?: PaymentLog[];
    notes?: string;
    status: "Pending" | "Approved" | "Rejected";
    createdAt: string;
}

export default function AdminSaleView() {
    const router = useRouter();
    const params = useParams();
    const saleId = params?.id as string;

    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<"Approve" | "Reject" | "Delete" | null>(null);

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
                toast.error("Failed to load sale details");
            } finally {
                setLoading(false);
            }
        };

        if (saleId) {
            fetchSale();
        }
    }, [saleId]);

    const handleApprove = async () => {
        if (!sale) return;

        setActionLoading(true);
        try {
            const response = await fetch(`/api/sales/${saleId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Approved" }),
            });

            if (!response.ok) throw new Error("Failed to approve sale");

            const updatedSale = await response.json();
            setSale(updatedSale);
            toast.success("Sale approved successfully");
        } catch (error) {
            console.error("Error approving sale:", error);
            toast.error("Failed to approve sale");
        } finally {
            setActionLoading(false);
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    };

    const handleReject = async () => {
        if (!sale) return;

        setActionLoading(true);
        try {
            const response = await fetch(`/api/sales/${saleId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Rejected" }),
            });

            if (!response.ok) throw new Error("Failed to reject sale");

            const updatedSale = await response.json();
            setSale(updatedSale);
            toast.error("Sale rejected");
        } catch (error) {
            console.error("Error rejecting sale:", error);
            toast.error("Failed to reject sale");
        } finally {
            setActionLoading(false);
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    };

    const handleDelete = async () => {
        if (!sale) return;

        setActionLoading(true);
        try {
            const response = await fetch(`/api/sales/${saleId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete sale");

            toast.success("Sale deleted successfully");
            router.push("/admin/sales");
        } catch (error) {
            console.error("Error deleting sale:", error);
            toast.error("Failed to delete sale");
        } finally {
            setActionLoading(false);
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    };

    const openConfirmDialog = (action: "Approve" | "Reject" | "Delete") => {
        setConfirmAction(action);
        setConfirmOpen(true);
    };

    const getStatusBadge = (status: Sale["status"]) => {
        switch (status) {
            case "Pending":
                return (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700">
                        Pending
                    </span>
                );
            case "Approved":
                return (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                        Approved
                    </span>
                );
            case "Rejected":
                return (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-600">
                        Rejected
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6] mb-4"></div>
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
            <div className="p-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/admin/sales")}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-[#020617]">Sale Details</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/admin/sales/${sale._id}/edit`)}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => openConfirmDialog("Delete")}
                            disabled={actionLoading}
                            className="bg-[#dc2626] hover:bg-red-700 text-white gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                        {sale.status === "Pending" ? (
                            <>
                                <Button
                                    onClick={() => openConfirmDialog("Approve")}
                                    disabled={actionLoading}
                                    className="bg-[#22c55e] hover:bg-green-600 text-white gap-2"
                                >
                                    <Check className="h-4 w-4" />
                                    {actionLoading && confirmAction === "Approve" ? "Approving..." : "Approve"}
                                </Button>
                                <Button
                                    onClick={() => openConfirmDialog("Reject")}
                                    disabled={actionLoading}
                                    className="bg-[#dc2626] hover:bg-red-700 text-white gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    {actionLoading && confirmAction === "Reject" ? "Rejecting..." : "Reject"}
                                </Button>
                            </>
                        ) : (
                            getStatusBadge(sale.status)
                        )}
                    </div>
                </div>

                {/* Details Card */}
                <Card className="p-6 bg-white border rounded-xl shadow-sm space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#020617] mb-4 pb-2 border-b border-gray-100">
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[#64748b] mb-1">Sale ID</p>
                                <p className="text-sm font-semibold text-[#020617]">SALE-{sale._id?.slice(-6).toUpperCase()}</p>
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
                                <p className="text-xs uppercase tracking-wide text-[#64748b] mb-1">Customer Name</p>
                                <p className="text-sm font-semibold text-[#020617]">{sale.customerName || "Walk-in"}</p>
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

                    {/* Products */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#020617] mb-4 pb-2 border-b border-gray-100">
                            Sold Items
                        </h2>
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-[#020617]">Product</TableHead>
                                    <TableHead className="font-semibold text-[#020617] text-center">Quantity</TableHead>
                                    <TableHead className="font-semibold text-[#020617] text-right">Rate</TableHead>
                                    <TableHead className="font-semibold text-[#020617] text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                        <TableCell className="text-center">{item.quantity} {item.unit}</TableCell>
                                        <TableCell className="text-right">₨ {item.rate.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-semibold">₨ {item.total.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Bill Summary */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#020617] mb-4 pb-2 border-b border-gray-100">
                            Bill Summary
                        </h2>
                        <div className="space-y-2 max-w-md">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#64748b]">Subtotal:</span>
                                <span className="font-medium">₨ {sale.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#64748b]">Tax:</span>
                                <span className="font-medium">₨ {sale.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Grand Total:</span>
                                <span className="text-[#14b8a6]">₨ {sale.grandTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#64748b]">Amount Paid:</span>
                                <span className="font-medium text-green-600">₨ {sale.amountPaid.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold">
                                <span className={sale.grandTotal - sale.amountPaid > 0 ? "text-red-500" : "text-green-600"}>
                                    Remaining:
                                </span>
                                <span className={sale.grandTotal - sale.amountPaid > 0 ? "text-red-500" : "text-green-600"}>
                                    ₨ {(sale.grandTotal - sale.amountPaid).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Logs */}
                    {sale.paymentHistory && sale.paymentHistory.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-[#020617] mb-4 pb-2 border-b border-gray-100">
                                Payment Logs
                            </h2>
                            <div className="space-y-4">
                                {sale.paymentHistory.map((log, index) => (
                                    <div key={index} className="flex gap-4 relative">
                                        {index !== sale.paymentHistory!.length - 1 && (
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
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmAction === "Approve" ? "Confirm Approval" : confirmAction === "Reject" ? "Confirm Rejection" : "Confirm Deletion"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction === "Delete"
                                ? "Are you sure you want to delete this sale? This action is permanent and cannot be undone."
                                : `Are you sure you want to ${confirmAction?.toLowerCase()} this sale? This action cannot be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmAction === "Approve") {
                                    handleApprove();
                                } else if (confirmAction === "Reject") {
                                    handleReject();
                                } else if (confirmAction === "Delete") {
                                    handleDelete();
                                }
                            }}
                            className={confirmAction === "Approve" ? "bg-[#22c55e] hover:bg-green-600 rounded-md" : "bg-[#dc2626] hover:bg-red-700 rounded-md"}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
