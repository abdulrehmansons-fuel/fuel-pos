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
import { ShoppingCart, Droplet, Calculator, Info } from "lucide-react";
import { toast } from "sonner";

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
    totalQuantity: number;
}

interface Nozzle {
    name: string;
    fuelType: string;
}

interface PumpData {
    nozzles?: Nozzle[];
}



export default function CreateSale() {
    const router = useRouter();
    const params = useParams();
    const pumpId = params?.pump as string;
    const employerId = params?.id as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [pumpData, setPumpData] = useState<PumpData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (pumpId) {
                const fetchedProducts = await getPumpStocks(pumpId);
                setProducts(fetchedProducts);

                // Fetch pump details for nozzles
                try {
                    const pumpRes = await fetch(`/api/fuel-pumps/${pumpId}`);
                    if (pumpRes.ok) {
                        const pump = await pumpRes.json();
                        console.log('Pump data loaded:', pump);
                        console.log('Nozzles:', pump.nozzles);
                        setPumpData(pump);
                    }
                } catch (error) {
                    console.error("Error fetching pump data:", error);
                }
            }
        };
        fetchData();
    }, [pumpId]);

    const [currentItem, setCurrentItem] = useState({
        productName: "",
        category: "",
        totalAmount: 0,
        quantity: 0,
        unit: "L" as "L" | "mL" | "pcs",
        rate: 0,
        nozzleId: "",
    });

    const handleNozzleSelect = (nozzleId: string) => {
        const nozzle = pumpData?.nozzles?.find(n => n.name === nozzleId);
        if (nozzle) {
            const product = products.find(p => p.category === nozzle.fuelType);
            if (product) {
                setCurrentItem({
                    ...currentItem,
                    nozzleId: nozzleId,
                    productName: product.name,
                    category: product.category,
                    rate: product.rate,
                    unit: product.defaultUnit,
                    totalAmount: 0,
                    quantity: 0,
                });
            } else {
                setCurrentItem({
                    ...currentItem,
                    nozzleId: nozzleId,
                    productName: "",
                    category: nozzle.fuelType,
                    rate: 0,
                    unit: "L",
                    totalAmount: 0,
                    quantity: 0,
                });
            }
        }
    };

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

    const subtotal = currentItem.totalAmount;
    const tax = 0;
    const grandTotal = subtotal + tax;

    const handleSubmit = () => {
        if (!currentItem.productName || currentItem.totalAmount <= 0) {
            alert("Please select a product and enter a valid amount");
            return;
        }

        // Stock Validation
        const product = products.find(p => p.name === currentItem.productName);
        const quantityInLiters = currentItem.totalAmount / (currentItem.rate || 1);

        if (product && quantityInLiters > product.totalQuantity) {
            toast.error(`Insufficient stock! Available: ${product.totalQuantity.toFixed(2)} L`);
            return;
        }

        // Prepare single item as an array for compatibility with checkout page
        const singleItem: SaleItem = {
            id: Date.now().toString(),
            productName: currentItem.productName,
            category: currentItem.category,
            quantity: currentItem.quantity,
            unit: currentItem.unit,
            quantityInLiters,
            rate: currentItem.rate,
            total: currentItem.totalAmount,
        };

        // Add nozzleId to localStorage for checkout
        const saleData = {
            items: [singleItem],
            subtotal,
            tax,
            grandTotal,
            nozzleId: currentItem.nozzleId,
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
                    {/* Left Column - Product Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6 bg-white border shadow-sm rounded-xl">
                            <h2 className="text-lg font-semibold text-[#020617] mb-4 flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-[#14b8a6]" />
                                Sale Details
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nozzle Selection */}
                                {pumpData?.nozzles && pumpData.nozzles.length > 0 && (
                                    <div className="md:col-span-2">
                                        <Label htmlFor="nozzle">Select Nozzle</Label>
                                        <Select
                                            value={currentItem.nozzleId}
                                            onValueChange={handleNozzleSelect}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select nozzle" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white max-h-60">
                                                {pumpData.nozzles.map((nozzle) => (
                                                    <SelectItem key={nozzle.name} value={nozzle.name}>
                                                        {nozzle.name} - {nozzle.fuelType}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

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
                                        autoFocus
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
                                    <div className="mt-1 h-10 px-3 py-2 bg-[#14b8a6]/10 border border-[#14b8a6]/30 rounded-md flex items-center justify-between">
                                        <span className="text-lg font-bold text-[#14b8a6]">
                                            {currentItem.quantity > 0 ? formatQuantityDisplay(currentItem.quantity, currentItem.unit) : "0"}
                                        </span>
                                        {currentItem.productName && (
                                            <div className="flex items-center gap-1 text-[10px] bg-white px-2 py-0.5 rounded border border-[#14b8a6]/20">
                                                <Info className="h-3 w-3 text-[#14b8a6]" />
                                                <span className="text-[#64748b]">Available: </span>
                                                <span className="font-bold text-[#020617]">
                                                    {products.find(p => p.name === currentItem.productName)?.totalQuantity.toFixed(2)} L
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="space-y-6">
                        {/* Bill Summary */}
                        <Card className="p-6 bg-white border shadow-sm rounded-xl">
                            <h2 className="text-lg font-semibold text-[#020617] mb-4">Bill Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#64748b]">Product</span>
                                    <span className="text-[#020617] font-medium">{currentItem.productName || "-"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#64748b]">Quantity</span>
                                    <span className="text-[#020617] font-medium">
                                        {currentItem.quantity > 0 ? formatQuantityDisplay(currentItem.quantity, currentItem.unit) : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#64748b]">Subtotal</span>
                                    <span className="text-[#020617] font-medium">₨ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-[#020617]">Total To Pay</span>
                                        <span className="text-xl font-bold text-[#14b8a6]">
                                            ₨ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={!currentItem.productName || currentItem.totalAmount <= 0}
                                className="mt-6 w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white disabled:opacity-50 h-10"
                            >
                                Proceed to Checkout
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}