"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SaleItem {
    productName: string;
    category: string;
    quantity: number;
    unit: string;
    rate: number;
    total: number;
}

interface Sale {
    _id: string;
    employerId: any;
    pumpId: any;
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
    createdAt: string;
}

export default function AdminEditSale() {
    const router = useRouter();
    const params = useParams();
    const saleId = params?.id as string;

    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newPayment, setNewPayment] = useState<number>(0);
    const [paymentNotes, setPaymentNotes] = useState("");

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

    const remainingAmount = sale.grandTotal - sale.amountPaid;

    const handleUpdatePayment = async () => {
        if (newPayment <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (newPayment > remainingAmount) {
            toast.error("Amount exceeds remaining balance");
            return;
        }

        setSubmitting(true);
        try {
            const updatedAmountPaid = sale.amountPaid + newPayment;

            const response = await fetch(`/api/sales/${saleId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amountPaid: updatedAmountPaid,
                    notes: paymentNotes || `Payment of ₨${newPayment} added by Admin`,
                    performedBy: "Admin: Manager",
                }),
            });

            if (!response.ok) throw new Error("Failed to update payment");

            const updatedSale = await response.json();
            setSale(updatedSale);
            setNewPayment(0);
            setPaymentNotes("");
            toast.success("Payment updated successfully");
        } catch (error) {
            console.error("Error updating payment:", error);
            toast.error("Failed to update payment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-4 lg:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/sales/${saleId}/view`)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-[#020617]">Edit Sale Payment</h1>
                        <p className="text-sm text-[#64748b]">Update payment details for SALE-{sale._id.slice(-6).toUpperCase()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sale Details (Left) */}
                    <Card className="md:col-span-2 p-6 bg-white border shadow-sm rounded-xl">
                        <h2 className="text-lg font-semibold text-[#020617] mb-4">Sale Summary</h2>

                        <div className="mb-6">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sale.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="font-medium">{item.productName}</div>
                                                <div className="text-xs text-gray-500">
                                                    {item.quantity} {item.unit} x ₨{item.rate}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">₨ {item.total.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold border-t-2">
                                        <TableCell>Total Amount</TableCell>
                                        <TableCell className="text-right text-[#020617]">₨ {sale.grandTotal.toLocaleString()}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                    {/* Payment Update (Right) */}
                    <div className="space-y-6">
                        <Card className="p-6 bg-white border shadow-sm rounded-xl space-y-4">
                            <h2 className="text-lg font-semibold text-[#020617] flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-[#14b8a6]" />
                                Payment Status
                            </h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#64748b]">Total Amount</span>
                                    <span className="font-medium">₨ {sale.grandTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#64748b]">Already Paid</span>
                                    <span className="font-medium text-green-600">₨ {sale.amountPaid.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                    <span className={remainingAmount > 0 ? "text-red-500" : "text-green-600"}>
                                        {remainingAmount > 0 ? "Remaining" : "Fully Paid"}
                                    </span>
                                    <span className={remainingAmount > 0 ? "text-red-500" : "text-green-600"}>
                                        ₨ {remainingAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {remainingAmount > 0 ? (
                                <div className="pt-4 border-t space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="addPayment">Add Payment</Label>
                                        <Input
                                            id="addPayment"
                                            type="number"
                                            placeholder="Enter amount"
                                            value={newPayment || ""}
                                            onChange={(e) => setNewPayment(Number(e.target.value))}
                                            max={remainingAmount}
                                        />
                                        <p className="text-xs text-gray-500">Max addable: ₨ {remainingAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                                        <Textarea
                                            id="paymentNotes"
                                            placeholder="Payment notes..."
                                            value={paymentNotes}
                                            onChange={(e) => setPaymentNotes(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleUpdatePayment}
                                        className="w-full bg-[#14b8a6] hover:bg-[#0d9488]"
                                        disabled={submitting || newPayment <= 0 || newPayment > remainingAmount}
                                    >
                                        {submitting ? "Updating..." : "Update Payment"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm text-center font-medium">
                                    ✓ This sale is fully paid.
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
