"use client";
import { useState, useEffect } from "react";
import { getPumpStocks } from "@/app/actions/getStocks";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ShoppingCart, Droplet, Calculator } from "lucide-react";

interface SaleItem {
    id: string;
    productName: string;
    category: string;
    quantity: number;
    unit: "L" | "mL" | "pcs";
    quantityInLiters: number;
    rate: number;
    total: number;
}

interface Product {
    name: string;
    category: string;
    rate: number;
    unit: "L" | "mL" | "pcs";
    defaultUnit: "L" | "mL" | "pcs";
}



export default function CreateSale() {
    const router = useRouter();
    const params = useParams();
    const pumpId = params?.pump as string;
    const employerId = params?.id as string;

    const [items, setItems] = useState<SaleItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchStocks = async () => {
            if (pumpId) {
                const fetchedProducts = await getPumpStocks(pumpId);
                setProducts(fetchedProducts);
            }
        };
        fetchStocks();
    }, [pumpId]);
    const [currentItem, setCurrentItem] = useState({
        productName: "",
        category: "",
        totalAmount: 0,
        quantity: 0,
        unit: "L" as "L" | "mL" | "pcs",
        rate: 0,
    });
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [notes, setNotes] = useState("");

    const handleProductSelect = (productName: string) => {
        const product = products.find((p) => p.name === productName);
        if (product) {
            setCurrentItem({
                ...currentItem,
                productName: product.name,
                category: product.category,
                rate: product.rate,
                unit: product.defaultUnit,
                totalAmount: 0,
                quantity: 0,
            });
        }
    };

    const handleAmountChange = (amount: number) => {
        if (!currentItem.rate || currentItem.rate <= 0) {
            setCurrentItem({ ...currentItem, totalAmount: amount, quantity: 0 });
            return;
        }

        // Calculate quantity in liters
        const quantityInLiters = amount / currentItem.rate;

        // Convert to selected unit
        let displayQuantity = quantityInLiters;
        if (currentItem.unit === "mL") {
            displayQuantity = quantityInLiters * 1000;
        }

        setCurrentItem({
            ...currentItem,
            totalAmount: amount,
            quantity: displayQuantity,
        });
    };

    const handleUnitChange = (newUnit: "L" | "mL" | "pcs") => {
        if (!currentItem.totalAmount || !currentItem.rate) {
            setCurrentItem({ ...currentItem, unit: newUnit });
            return;
        }

        // Recalculate quantity for new unit
        const quantityInLiters = currentItem.totalAmount / currentItem.rate;
        let displayQuantity = quantityInLiters;

        if (newUnit === "mL") {
            displayQuantity = quantityInLiters * 1000;
        }

        setCurrentItem({
            ...currentItem,
            unit: newUnit,
            quantity: displayQuantity,
        });
    };



    const formatQuantityDisplay = (quantity: number, unit: "L" | "mL" | "pcs"): string => {
        if (unit === "L") {
            return `${quantity.toFixed(3)} L`;
        } else if (unit === "mL") {
            return `${Math.round(quantity)} mL`;
        }
        return `${quantity} pcs`;
    };

    const addItem = () => {
        if (!currentItem.productName || currentItem.totalAmount <= 0 || currentItem.rate <= 0) {
            alert("Please select a product and enter a valid amount");
            return;
        }

        const quantityInLiters = currentItem.totalAmount / currentItem.rate;

        const newItem: SaleItem = {
            id: Date.now().toString(),
            productName: currentItem.productName,
            category: currentItem.category,
            quantity: currentItem.quantity,
            unit: currentItem.unit,
            quantityInLiters,
            rate: currentItem.rate,
            total: currentItem.totalAmount,
        };

        setItems([...items, newItem]);
        setCurrentItem({
            productName: "",
            category: "",
            totalAmount: 0,
            quantity: 0,
            unit: "L",
            rate: 0,
        });
    };

    const removeItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = 0;
    const grandTotal = subtotal + tax;

    const handleSubmit = () => {
        if (items.length === 0) {
            alert("Please add at least one item");
            return;
        }

        // Store sale data in localStorage for checkout page
        const saleData = {
            items,
            paymentMethod,
            notes,
            subtotal,
            tax,
            grandTotal,
        };

        localStorage.setItem('pendingSale', JSON.stringify(saleData));

        router.push(`/employer/${pumpId}/${employerId}/checkout?total=${grandTotal}`);
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9]">
            <div className="p-4 lg:p-6 max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#020617] flex items-center gap-2">
                        <Droplet className="h-7 w-7 text-[#14b8a6]" />
                        Create New Sale
                    </h1>
                    <p className="text-sm text-[#64748b] mt-1">Enter amount to automatically calculate fuel quantity</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Add Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Add Item Card */}
                        <Card className="p-6 bg-white border shadow-sm rounded-xl">
                            <h2 className="text-lg font-semibold text-[#020617] mb-4 flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-[#14b8a6]" />
                                Add Item
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="product">Product / Fuel Type</Label>
                                    <Select
                                        value={currentItem.productName}
                                        onValueChange={handleProductSelect}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select product or fuel type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white max-h-60">
                                            {products.length === 0 ? (
                                                <div className="p-2 text-sm text-gray-500">No stocks available</div>
                                            ) : (
                                                products.map((product) => (
                                                    <SelectItem key={product.name} value={product.name}>
                                                        {product.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Input
                                        id="category"
                                        value={currentItem.category}
                                        disabled
                                        className="mt-1 bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="rate">Rate (₨ per {currentItem.unit || "unit"})</Label>
                                    <Input
                                        id="rate"
                                        type="number"
                                        value={currentItem.rate || ""}
                                        disabled
                                        className="mt-1 bg-gray-50 font-semibold"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="amount" className="flex items-center gap-2">
                                        <Calculator className="h-4 w-4 text-[#14b8a6]" />
                                        Enter Amount (₨)
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={currentItem.totalAmount || ""}
                                        onChange={(e) => handleAmountChange(Number(e.target.value))}
                                        className="mt-1 text-lg font-semibold"
                                        placeholder="Enter amount in rupees"
                                    />
                                    <p className="text-xs text-[#64748b] mt-1">
                                        Example: Enter ₨150 for diesel at ₨300/L = 0.5L (500mL)
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="unit">Display Unit</Label>
                                    <Select
                                        value={currentItem.unit}
                                        onValueChange={(value: "L" | "mL" | "pcs") => handleUnitChange(value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="L">Liters (L)</SelectItem>
                                            <SelectItem value="mL">Milliliters (mL)</SelectItem>
                                            <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Calculated Quantity</Label>
                                    <div className="mt-1 h-10 px-3 py-2 bg-[#14b8a6]/10 border border-[#14b8a6]/30 rounded-md flex items-center">
                                        <span className="text-lg font-bold text-[#14b8a6]">
                                            {currentItem.quantity > 0 ? formatQuantityDisplay(currentItem.quantity, currentItem.unit) : "0"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={addItem}
                                className="mt-4 w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white"
                                disabled={!currentItem.productName || currentItem.totalAmount <= 0}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item to Sale
                            </Button>
                        </Card>

                        {/* Items List */}
                        {items.length > 0 && (
                            <Card className="p-6 bg-white border shadow-sm rounded-xl">
                                <h2 className="text-lg font-semibold text-[#020617] mb-4">Sale Items ({items.length})</h2>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-center">Quantity</TableHead>
                                                <TableHead className="text-center">Rate (₨)</TableHead>
                                                <TableHead className="text-right">Total (₨)</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-[#020617]">{item.productName}</p>
                                                            <p className="text-xs text-[#64748b]">{item.category}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-medium">{formatQuantityDisplay(item.quantity, item.unit)}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">₨ {item.rate.toLocaleString()}/{item.unit}</TableCell>
                                                    <TableCell className="text-right font-medium text-[#14b8a6]">
                                                        ₨ {item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Summary */}
                    <div className="space-y-6">
                        {/* Payment Details */}
                        <Card className="p-6 bg-white border shadow-sm rounded-xl">
                            <h2 className="text-lg font-semibold text-[#020617] mb-4">Payment Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="payment">Payment Method</Label>
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
                            </div>
                        </Card>

                        {/* Bill Summary */}
                        <Card className="p-6 bg-white border shadow-sm rounded-xl">
                            <h2 className="text-lg font-semibold text-[#020617] mb-4">Bill Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#64748b]">Items</span>
                                    <span className="text-[#020617] font-medium">{items.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#64748b]">Subtotal</span>
                                    <span className="text-[#020617] font-medium">₨ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#64748b]">Tax</span>
                                    <span className="text-[#020617] font-medium">₨ {tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-[#020617]">Grand Total</span>
                                        <span className="text-xl font-bold text-[#14b8a6]">
                                            ₨ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={items.length === 0}
                                className="mt-6 w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white disabled:opacity-50"
                            >
                                Complete Sale
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}