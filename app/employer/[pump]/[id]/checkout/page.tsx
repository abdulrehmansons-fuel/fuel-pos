"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Download, Printer, ArrowLeft } from "lucide-react";
import { getPumpDetails } from "@/app/actions/getPumpDetails";

interface SaleItem {
    id: string;
    productName: string;
    category: string;
    quantity: number;
    unit: "L" | "mL" | "pcs";
    rate: number;
    total: number;
}

export default function CheckoutPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const receiptRef = useRef<HTMLDivElement>(null);

    const pumpId = params?.pump as string;
    const employerId = params?.id as string;

    const [pumpDetails, setPumpDetails] = useState<{ _id: string; pumpName: string; location?: string } | null>(null);
    const [completedSaleData, setCompletedSaleData] = useState<{ _id: string; createdAt: string } | null>(null); // Store backend response

    // Get sale data from localStorage
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        const pendingSale = localStorage.getItem('pendingSale');
        if (pendingSale) {
            const saleData = JSON.parse(pendingSale);
            setSaleItems(saleData.items || []);
            setTotalAmount(saleData.grandTotal || 0);
        } else {
            // Fallback to URL param
            setTotalAmount(parseFloat(searchParams?.get("total") || "0"));
        }
    }, [searchParams]);

    // Fetch Pump ID on mount
    useEffect(() => {
        const fetchPump = async () => {
            if (pumpId) {
                const details = await getPumpDetails(pumpId);
                if (details) {
                    setPumpDetails(details);
                } else {
                    console.error("Pump not found");
                }
            }
        };
        fetchPump();
    }, [pumpId]);

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [amountPaid, setAmountPaid] = useState(totalAmount.toString());
    const [notes, setNotes] = useState("");
    const [saleCompleted, setSaleCompleted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update amountPaid when totalAmount changes
    useEffect(() => {
        setAmountPaid(totalAmount.toString());
    }, [totalAmount]);

    const amountPaidNum = parseFloat(amountPaid) || 0;
    const balance = totalAmount - amountPaidNum;
    const paymentStatus = balance > 0 ? "Partial" : balance < 0 ? "Overpaid" : "Paid";

    const formatQuantityDisplay = (quantity: number, unit: "L" | "mL" | "pcs"): string => {
        if (unit === "L") {
            return `${quantity.toFixed(3)} L`;
        } else if (unit === "mL") {
            return `${Math.round(quantity)} mL`;
        }
        return `${quantity} pcs`;
    };

    // Helper to validate phone number
    const isValidPhone = (phone: string) => {
        const phoneRegex = /^03\d{9}$/; // Starts with 03, followed by 9 digits (total 11)
        return phoneRegex.test(phone);
    };

    const handleCompleteSale = async () => {
        if (!customerName || !customerPhone) {
            alert("Customer Name and Phone Number are required.");
            return;
        }

        if (!isValidPhone(customerPhone)) {
            alert("Invalid Phone Number. Must start with '03' and be 11 digits long (e.g., 03222222222).");
            return;
        }

        if (!pumpDetails?._id) {
            alert("Pump details not loaded. Please wait or refresh.");
            return;
        }

        setIsSubmitting(true);
        try {
            const change = balance < 0 ? Math.abs(balance) : 0;

            const payload = {
                employerId,
                pumpId: pumpDetails._id, // Use resolved ObjectId
                items: saleItems,
                subtotal: totalAmount, // Assuming no tax/add-ons for simplified flow
                tax: 0,
                grandTotal: totalAmount,
                amountPaid: amountPaidNum,
                changeReturned: change,
                paymentMethod,
                notes: notes + (customerName ? `\nCustomer: ${customerName}` : "") + (customerPhone ? `\nPhone: ${customerPhone}` : ""),
            };

            const response = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to complete sale");
            }

            const newSale = await response.json();
            setCompletedSaleData(newSale);

            // Clear localStorage
            localStorage.removeItem('pendingSale');
            setSaleCompleted(true);
        } catch (error) {
            console.error("Sale Error:", error);
            alert((error as Error).message || "An error occurred while processing the sale.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadReceipt = () => {
        // Create a printable version
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow && receiptRef.current) {
            printWindow.document.write('<html><head><title>Sale Receipt</title>');
            printWindow.document.write('<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2314b8a6\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M4 3h10v18H4z\'/%3E%3Cpath d=\'M14 7h2a2 2 0 0 1 2 2v7\'/%3E%3Cpath d=\'M9 17h6\'/%3E%3C/svg%3E" />');
            printWindow.document.write('<style>');
            printWindow.document.write(`
        body { font-family: Arial, sans-serif; padding: 20px; }
        .receipt { max-width: 500px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .row { display: flex; justify-between; margin: 8px 0; }
        .label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .total-row { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-size: 16px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
      `);
            printWindow.document.write('</style></head><body>');
            printWindow.document.write(receiptRef.current.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handlePrintReceipt = () => {
        handleDownloadReceipt();
    };

    if (saleCompleted) {
        return (
            <div className="min-h-screen bg-[#f1f5f9] p-6">
                <div className="max-w-3xl mx-auto">
                    {/* Success Message */}
                    <Card className="p-8 bg-white border shadow-sm rounded-xl text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 rounded-full p-4">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-[#020617] mb-2">Sale Completed!</h1>
                        <p className="text-[#64748b] mb-6">
                            {paymentStatus === "Paid"
                                ? "Payment received in full. Receipt is ready for download."
                                : paymentStatus === "Partial"
                                    ? `Partial payment received. Remaining balance: ₨${Math.abs(balance).toFixed(2)}`
                                    : `Overpayment of ₨${Math.abs(balance).toFixed(2)}. Change to return.`
                            }
                        </p>

                        <div className="flex gap-3 justify-center mb-6">
                            <Button
                                onClick={handlePrintReceipt}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Printer className="h-4 w-4" />
                                Print Receipt
                            </Button>
                            <Button
                                onClick={handleDownloadReceipt}
                                className="bg-[#14b8a6] hover:bg-[#0d9488] text-white flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download Receipt
                            </Button>
                        </div>
                    </Card>

                    {/* Receipt Preview */}
                    <Card className="p-6 bg-white border shadow-sm rounded-xl">
                        <div ref={receiptRef} className="receipt">
                            <div className="header">
                                <h2 className="text-2xl font-bold">FUEL POS</h2>
                                <p className="text-sm text-gray-600">Sale Receipt</p>
                                <p className="text-sm font-semibold mt-1">{pumpDetails?.pumpName || "Unknown Pump"}</p>
                                {pumpDetails?.location && <p className="text-xs text-gray-500">{pumpDetails.location}</p>}
                                <p className="text-xs text-gray-500 mt-1">
                                    Date: {completedSaleData ? new Date(completedSaleData.createdAt).toLocaleString() : new Date().toLocaleString()}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="row">
                                    <span className="label">Receipt #:</span>
                                    <span>
                                        {completedSaleData
                                            ? `SALE-${completedSaleData._id.slice(-6).toUpperCase()}`
                                            : `PENDING`
                                        }
                                    </span>
                                </div>
                                {customerName && (
                                    <div className="row">
                                        <span className="label">Customer:</span>
                                        <span>{customerName}</span>
                                    </div>
                                )}
                                {customerPhone && (
                                    <div className="row">
                                        <span className="label">Phone:</span>
                                        <span>{customerPhone}</span>
                                    </div>
                                )}
                                <div className="row">
                                    <span className="label">Payment Method:</span>
                                    <span>{paymentMethod}</span>
                                </div>
                            </div>

                            {/* Items Table */}
                            {saleItems.length > 0 && (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th style={{ textAlign: 'center' }}>Qty</th>
                                            <th style={{ textAlign: 'right' }}>Rate</th>
                                            <th style={{ textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {saleItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                                                        <div style={{ fontSize: '11px', color: '#666' }}>{item.category}</div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{formatQuantityDisplay(item.quantity, item.unit)}</td>
                                                <td style={{ textAlign: 'right' }}>₨{item.rate.toFixed(2)}/{item.unit}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₨{item.total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            <div className="total-row">
                                <div className="row">
                                    <span className="label">Total Amount:</span>
                                    <span>₨{totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="row">
                                    <span className="label">Amount Paid:</span>
                                    <span>₨{amountPaidNum.toFixed(2)}</span>
                                </div>
                                {balance !== 0 && (
                                    <div className="row" style={{ color: balance > 0 ? '#dc2626' : '#22c55e' }}>
                                        <span className="label">{balance > 0 ? 'Balance Due:' : 'Change:'}</span>
                                        <span>₨{Math.abs(balance).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {notes && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                                    <p className="label">Notes:</p>
                                    <p style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>{notes}</p>
                                </div>
                            )}

                            <div className="footer">
                                <p>Thank you for your business!</p>
                                <p>Powered by Fuel POS System</p>
                            </div>
                        </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-3">
                        <Button
                            onClick={() => router.push(`/employer/${pumpId}/${employerId}/createSales`)}
                            className="flex-1 bg-[#14b8a6] hover:bg-[#0d9488] text-white"
                        >
                            Create Another Sale
                        </Button>
                        <Button
                            onClick={() => router.push(`/employer/${pumpId}/${employerId}/sales`)}
                            variant="outline"
                            className="flex-1"
                        >
                            View My Sales
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-[#020617]">Complete Sale</h1>
                        <p className="text-sm text-[#64748b]">Review order and enter payment details</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Order Summary */}
                    <Card className="p-6 bg-white border shadow-sm rounded-xl">
                        <h2 className="text-lg font-semibold text-[#020617] mb-4">Order Summary</h2>

                        {saleItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">Quantity</TableHead>
                                            <TableHead className="text-center">Rate</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {saleItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-[#020617]">{item.productName}</p>
                                                        <p className="text-xs text-[#64748b]">{item.category}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">
                                                    {formatQuantityDisplay(item.quantity, item.unit)}
                                                </TableCell>
                                                <TableCell className="text-center">₨{item.rate.toFixed(2)}/{item.unit}</TableCell>
                                                <TableCell className="text-right font-medium text-[#14b8a6]">
                                                    ₨{item.total.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-[#64748b] text-center py-4">No items in order</p>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-[#020617]">Total Amount</span>
                                <span className="text-2xl font-bold text-[#14b8a6]">₨{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white border shadow-sm rounded-xl space-y-6">
                        {/* Customer Information */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[#020617]">Customer Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="customerName">Customer Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="customerName"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Enter customer name"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="customerPhone">Phone Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="customerPhone"
                                        value={customerPhone}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Only allow digits to be typed
                                            if (/^\d*$/.test(val) && val.length <= 11) {
                                                setCustomerPhone(val);
                                            }
                                        }}
                                        placeholder="03xxxxxxxxx"
                                        className="mt-1"
                                    />
                                    {customerPhone && !isValidPhone(customerPhone) && (
                                        <p className="text-xs text-red-500 mt-1">Must start with 03 and be 11 digits.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[#020617]">Payment Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="paymentMethod">Payment Method</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Card">Card</SelectItem>
                                            <SelectItem value="Mobile Payment">Mobile Payment</SelectItem>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="amountPaid">Amount Paid (₨)</Label>
                                    <Input
                                        id="amountPaid"
                                        type="number"
                                        step="0.01"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(e.target.value)}
                                        placeholder="Enter amount paid"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Balance Display */}
                            <div className={`p-4 rounded-lg ${balance > 0 ? 'bg-red-50 border border-red-200' :
                                balance < 0 ? 'bg-yellow-50 border border-yellow-200' :
                                    'bg-green-50 border border-green-200'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                        {balance > 0 ? 'Remaining Balance:' : balance < 0 ? 'Change to Return:' : 'Payment Status:'}
                                    </span>
                                    <span className={`text-xl font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                        {balance === 0 ? 'Paid in Full' : `₨${Math.abs(balance).toFixed(2)}`}
                                    </span>
                                </div>
                                {balance > 0 && (
                                    <p className="text-xs text-red-600 mt-1">
                                        This sale will be marked as partially paid. Balance will be tracked.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any additional notes..."
                                className="mt-1"
                                rows={3}
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={handleCompleteSale}
                            disabled={saleItems.length === 0 || isSubmitting || !customerName || !customerPhone || !isValidPhone(customerPhone)}
                            className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white h-12 text-lg disabled:opacity-50"
                        >
                            {isSubmitting ? "Processing Sale..." : "Complete Sale & Generate Receipt"}
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
