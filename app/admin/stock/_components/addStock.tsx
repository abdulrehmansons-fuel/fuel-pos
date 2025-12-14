"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    stockAddSchema,
    type StockAddFormData,
    FUEL_TYPES,
    PAYMENT_TYPES
} from "@/validators/stock";

const AddStock = () => {
    const router = useRouter();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<StockAddFormData>({
        resolver: zodResolver(stockAddSchema),
        defaultValues: {
            fuelType: undefined,
            quantity: "",
            purchasePricePerLiter: "",
            salePricePerLiter: "",
            purchaseDate: "",
            supplier: "",
            paymentType: undefined,
            notes: "",
        },
    });

    const quantity = useWatch({ control, name: "quantity" });
    const purchasePricePerLiter = useWatch({ control, name: "purchasePricePerLiter" });
    const salePricePerLiter = useWatch({ control, name: "salePricePerLiter" });

    const totalPurchaseAmount =
        quantity && purchasePricePerLiter && !isNaN(Number(quantity)) && !isNaN(Number(purchasePricePerLiter))
            ? (parseFloat(quantity) * parseFloat(purchasePricePerLiter)).toFixed(2)
            : "0.00";

    const totalSaleAmount =
        quantity && salePricePerLiter && !isNaN(Number(quantity)) && !isNaN(Number(salePricePerLiter))
            ? (parseFloat(quantity) * parseFloat(salePricePerLiter)).toFixed(2)
            : "0.00";

    const onSubmit = (data: StockAddFormData) => {
        console.log("Stock Form Data:", data);

        toast({
            title: "Stock Purchase Added",
            description: `${data.fuelType} purchase has been recorded.`,
        });

        // Mock API delay
        setTimeout(() => router.push("/admin/stock"), 1000);
    };

    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            {/* Back Button + Title */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="outline"
                    onClick={() => router.push("/admin/stock")}
                    className="rounded-md"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-xl font-semibold text-[#020617]">Add Stock Purchase</h1>
            </div>

            {/* Form Card */}
            <Card className="p-6 bg-white border shadow-sm rounded-xl space-y-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Section 1: Fuel Information */}
                    <div className="space-y-4 mb-6">
                        <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide">
                            Fuel Information
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fuelType" className="text-[#020617]">
                                    Fuel Type <span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="fuelType"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="rounded-md">
                                                <SelectValue placeholder="Select product / fuel type" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {FUEL_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.fuelType && (
                                    <p className="text-sm text-red-500">{errors.fuelType.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="text-[#020617]">
                                    Quantity (Liters) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    placeholder="Enter quantity"
                                    className="rounded-md"
                                    min="0"
                                    step="0.01"
                                    {...register("quantity")}
                                />
                                {errors.quantity && (
                                    <p className="text-sm text-red-500">{errors.quantity.message}</p>
                                )}
                            </div>

                            {/* Purchase Price Section */}
                            <div className="space-y-2">
                                <Label htmlFor="purchasePricePerLiter" className="text-[#020617]">
                                    Purchase Price Per Liter (Rs.) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="purchasePricePerLiter"
                                    type="number"
                                    placeholder="Enter purchase price"
                                    className="rounded-md"
                                    min="0"
                                    step="0.01"
                                    {...register("purchasePricePerLiter")}
                                />
                                {errors.purchasePricePerLiter && (
                                    <p className="text-sm text-red-500">{errors.purchasePricePerLiter.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="totalPurchaseAmount" className="text-[#020617]">
                                    Total Purchase Amount (Rs.)
                                </Label>
                                <Input
                                    id="totalPurchaseAmount"
                                    value={`Rs. ${Number(totalPurchaseAmount).toLocaleString()}`}
                                    readOnly
                                    className="rounded-md bg-green-50 text-green-700 font-medium border-green-200"
                                />
                            </div>

                            {/* Sale Price Section */}
                            <div className="space-y-2">
                                <Label htmlFor="salePricePerLiter" className="text-[#020617]">
                                    Sale Price Per Liter (Rs.) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="salePricePerLiter"
                                    type="number"
                                    placeholder="Enter sale price"
                                    className="rounded-md"
                                    min="0"
                                    step="0.01"
                                    {...register("salePricePerLiter")}
                                />
                                {errors.salePricePerLiter && (
                                    <p className="text-sm text-red-500">{errors.salePricePerLiter.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="totalSaleAmount" className="text-[#020617]">
                                    Total Estimated Sale Amount (Rs.)
                                </Label>
                                <Input
                                    id="totalSaleAmount"
                                    value={`Rs. ${Number(totalSaleAmount).toLocaleString()}`}
                                    readOnly
                                    className="rounded-md bg-blue-50 text-blue-700 font-medium border-blue-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="purchaseDate" className="text-[#020617]">
                                    Purchase Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="purchaseDate"
                                    type="date"
                                    className="rounded-md"
                                    {...register("purchaseDate")}
                                />
                                {errors.purchaseDate && (
                                    <p className="text-sm text-red-500">{errors.purchaseDate.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Purchase Details */}
                    <div className="space-y-4 mb-6">
                        <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide">
                            Purchase Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="supplier" className="text-[#020617]">
                                    Purchase Company / Supplier
                                </Label>
                                <Input
                                    id="supplier"
                                    placeholder="Enter supplier name"
                                    className="rounded-md"
                                    {...register("supplier")}
                                />
                                {errors.supplier && (
                                    <p className="text-sm text-red-500">{errors.supplier.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentType" className="text-[#020617]">
                                    Payment Type
                                </Label>
                                <Controller
                                    name="paymentType"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="rounded-md">
                                                <SelectValue placeholder="Select payment type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.paymentType && (
                                    <p className="text-sm text-red-500">{errors.paymentType.message}</p>
                                )}
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label className="text-[#020617]">Payment Screenshot (Optional)</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-[#14b8a6] transition-colors cursor-pointer">
                                    <Upload className="h-8 w-8 mx-auto text-[#64748b] mb-2" />
                                    <p className="text-sm text-[#64748b]">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-[#64748b] mt-1">
                                        PNG, JPG up to 5MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Notes */}
                    <div className="space-y-4 mb-6">
                        <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide">
                            Notes
                        </h2>
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-[#020617]">
                                Notes (Optional)
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Enter any additional notes..."
                                className="rounded-md min-h-[100px]"
                                {...register("notes")}
                            />
                            {errors.notes && (
                                <p className="text-sm text-red-500">{errors.notes.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/admin/stock")}
                            className="rounded-md"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2"
                        >
                            {isSubmitting ? "Adding..." : "Add Stock Purchase"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AddStock;
