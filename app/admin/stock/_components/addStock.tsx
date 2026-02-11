"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Upload, Loader2, Save, X } from "lucide-react";
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
import { toast } from "sonner";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    stockAddSchema,
    type StockAddFormData,
    FUEL_TYPES,
    PAYMENT_TYPES,
    LUBE_CATEGORIES,
    LUBE_VOLUMES,
    LUBE_BRANDS
} from "@/validators/stock";
import Image from "next/image";

const AddStock = () => {
    const router = useRouter();
    const [pumps, setPumps] = useState<{ _id: string, pumpName: string }[]>([]);
    const [loadingPumps, setLoadingPumps] = useState(true);
    // Image Preview State
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Custom Lube Selection States
    const [isCustomVolume, setIsCustomVolume] = useState(false);
    const [isCustomBrand, setIsCustomBrand] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<StockAddFormData>({
        resolver: zodResolver(stockAddSchema),
        defaultValues: {
            fuelType: undefined,
            quantity: "",
            purchasePricePerLiter: "",
            salePricePerLiter: "",
            purchaseDate: new Date().toISOString().split('T')[0],
            supplier: "",
            paymentType: undefined,
            pump: undefined,
            notes: "",
            paymentProofImage: "",
            // New fields
            lubeCategory: undefined,
            unitVolume: undefined,
            lubeName: undefined,
            unitsQuantity: undefined,
        },
    });

    useEffect(() => {
        const fetchPumps = async () => {
            try {
                const res = await fetch("/api/fuel-pumps");
                if (res.ok) {
                    const data = await res.json();
                    setPumps(data);
                }
            } catch (error) {
                console.error("Error fetching pumps:", error);
                toast.error("Failed to load fuel pumps");
            } finally {
                setLoadingPumps(false);
            }
        };
        fetchPumps();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                setValue("paymentProofImage", base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setValue("paymentProofImage", "");
    };

    // Watch fields for logic
    const fuelType = useWatch({ control, name: "fuelType" });
    const quantity = useWatch({ control, name: "quantity" });
    const purchasePricePerLiter = useWatch({ control, name: "purchasePricePerLiter" }); // This will act as Per Unit Price for Lubes
    const salePricePerLiter = useWatch({ control, name: "salePricePerLiter" }); // This will act as Per Unit Price for Lubes

    // Lube specific watches
    const lubeCategory = useWatch({ control, name: "lubeCategory" });
    const unitVolume = useWatch({ control, name: "unitVolume" });
    const unitsQuantity = useWatch({ control, name: "unitsQuantity" });

    // Effect: Auto-calculate Total Liters for Lubes
    useEffect(() => {
        if (fuelType === 'Lubricants' && unitsQuantity && unitVolume) {
            const totalL = Number(unitsQuantity) * Number(unitVolume);
            setValue("quantity", totalL.toFixed(2));
        }
    }, [fuelType, unitsQuantity, unitVolume, setValue]);

    // Effect: Sync isCustomVolume state based on form value
    useEffect(() => {
        if (lubeCategory && unitVolume !== undefined) {
            const presets = LUBE_VOLUMES[lubeCategory as keyof typeof LUBE_VOLUMES] as readonly number[];
            const isPreset = presets.includes(Number(unitVolume));
            setIsCustomVolume(!isPreset);
        } else {
            setIsCustomVolume(false);
        }
    }, [lubeCategory, unitVolume]);

    // Effect: Sync isCustomBrand state based on form value
    useEffect(() => {
        if (lubeCategory && unitVolume && control._formValues.lubeName !== undefined) {
            const volKey = Number(unitVolume);
            const brandsMapForCategory = LUBE_BRANDS[lubeCategory as keyof typeof LUBE_BRANDS] as Record<number, readonly string[]>;
            const volumePresets = LUBE_VOLUMES[lubeCategory as keyof typeof LUBE_VOLUMES] as readonly number[];
            const isVolumePreset = volumePresets.includes(volKey);

            let presets: string[] = [];
            if (isVolumePreset) {
                presets = (brandsMapForCategory[volKey] || []) as string[];
            } else {
                presets = Array.from(new Set(
                    Object.values(brandsMapForCategory).flat()
                )).sort() as string[];
            }
            const isPresetValue = presets.includes(control._formValues.lubeName);
            setIsCustomBrand(!isPresetValue);
        } else {
            setIsCustomBrand(false);
        }
    }, [lubeCategory, unitVolume, control._formValues.lubeName]);


    const totalPurchaseAmount =
        fuelType === 'Lubricants'
            ? (unitsQuantity && purchasePricePerLiter && !isNaN(Number(unitsQuantity)) && !isNaN(Number(purchasePricePerLiter))
                ? (parseFloat(unitsQuantity.toString()) * parseFloat(purchasePricePerLiter)).toFixed(2)
                : "0.00")
            : (quantity && purchasePricePerLiter && !isNaN(Number(quantity)) && !isNaN(Number(purchasePricePerLiter))
                ? (parseFloat(quantity) * parseFloat(purchasePricePerLiter)).toFixed(2)
                : "0.00");

    const totalSaleAmount =
        fuelType === 'Lubricants'
            ? (unitsQuantity && salePricePerLiter && !isNaN(Number(unitsQuantity)) && !isNaN(Number(salePricePerLiter))
                ? (parseFloat(unitsQuantity.toString()) * parseFloat(salePricePerLiter)).toFixed(2)
                : "0.00")
            : (quantity && salePricePerLiter && !isNaN(Number(quantity)) && !isNaN(Number(salePricePerLiter))
                ? (parseFloat(quantity) * parseFloat(salePricePerLiter)).toFixed(2)
                : "0.00");

    const onSubmit = async (data: StockAddFormData) => {
        try {
            const formattedData = { ...data };

            // For Lubricants: 
            // 1. Inputs are 'Per Gallon'/'Per Pack'
            // 2. We need to store 'Per Liter' in DB fields purchasePricePerLiter/salePricePerLiter
            // 3. Calculation: PerLiter = PerPack / Volume

            if (data.fuelType === 'Lubricants' && data.unitVolume) {
                const vol = Number(data.unitVolume);
                if (vol > 0) {
                    formattedData.purchasePricePerLiter = (Number(data.purchasePricePerLiter) / vol).toFixed(2);
                    formattedData.salePricePerLiter = (Number(data.salePricePerLiter) / vol).toFixed(2);
                }
                // quantity is already calculated by effect and set in form, but we ensure it matches
                formattedData.quantity = (Number(data.unitsQuantity) * vol).toFixed(2);
            }

            const res = await fetch("/api/stocks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });

            if (res.ok) {
                toast.success(`${data.fuelType} purchase has been recorded.`);
                router.push("/admin/stock");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to add stock");
            }
        } catch (error) {
            console.error("Error adding stock:", error);
            toast.error("An unexpected error occurred");
        }
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
                                        <Select onValueChange={(val) => {
                                            field.onChange(val);
                                            // Reset dependent fields on type change
                                            setValue("lubeCategory", undefined);
                                            setValue("unitVolume", undefined);
                                            setValue("lubeName", undefined);
                                            setValue("unitsQuantity", undefined);
                                            setValue("quantity", "");
                                            setIsCustomVolume(false); // Reset custom states
                                            setIsCustomBrand(false);
                                        }} defaultValue={field.value}>
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
                                <Label htmlFor="pump" className="text-[#020617]">
                                    Pump / Station <span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="pump"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="rounded-md">
                                                <SelectValue placeholder={loadingPumps ? "Loading..." : "Select pump"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {pumps.map((pump) => (
                                                    <SelectItem key={pump._id} value={pump.pumpName}>{pump.pumpName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.pump && (
                                    <p className="text-sm text-red-500">{errors.pump.message}</p>
                                )}
                            </div>

                            {/* Lubricant Specific Fields */}
                            {fuelType === 'Lubricants' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="lubeCategory" className="text-[#020617]">
                                            Lube Category <span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="lubeCategory"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={(val) => {
                                                    field.onChange(val);
                                                    setValue("unitVolume", undefined);
                                                    setValue("lubeName", undefined);
                                                    setIsCustomVolume(false); // Reset custom states
                                                    setIsCustomBrand(false);
                                                }} defaultValue={field.value}>
                                                    <SelectTrigger className="rounded-md">
                                                        <SelectValue placeholder="Select category (Petrol/Diesel)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {LUBE_CATEGORIES.map((cat) => (
                                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.lubeCategory && (
                                            <p className="text-sm text-red-500">{errors.lubeCategory.message}</p>
                                        )}
                                    </div>

                                    {lubeCategory && (
                                        <div className="space-y-2">
                                            <Label htmlFor="unitVolume" className="text-[#020617]">
                                                Volume (Liters) <span className="text-red-500">*</span>
                                            </Label>
                                            <Controller
                                                name="unitVolume"
                                                control={control}
                                                render={({ field }) => {
                                                    const presets = LUBE_VOLUMES[lubeCategory as keyof typeof LUBE_VOLUMES] as readonly number[];

                                                    return (
                                                        <div className="space-y-2">
                                                            <Select
                                                                onValueChange={(val) => {
                                                                    if (val === "other") {
                                                                        setIsCustomVolume(true);
                                                                        field.onChange(undefined);
                                                                        setValue("lubeName", undefined);
                                                                    } else {
                                                                        setIsCustomVolume(false);
                                                                        field.onChange(Number(val));
                                                                        setValue("lubeName", undefined);
                                                                    }
                                                                }}
                                                                value={isCustomVolume ? "other" : (field.value?.toString() || "")}
                                                            >
                                                                <SelectTrigger className="rounded-md">
                                                                    <SelectValue placeholder="Select volume" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {presets.map((vol) => (
                                                                        <SelectItem key={vol} value={vol.toString()}>{vol} L</SelectItem>
                                                                    ))}
                                                                    <SelectItem value="other">Other</SelectItem>
                                                                </SelectContent>
                                                            </Select>

                                                            {isCustomVolume && (
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Enter custom volume (Liters)"
                                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                                    value={field.value || ""}
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="mt-2"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                }}
                                            />
                                            {errors.unitVolume && (
                                                <p className="text-sm text-red-500">{errors.unitVolume.message}</p>
                                            )}
                                        </div>
                                    )}

                                    {unitVolume && lubeCategory && (
                                        <div className="space-y-2">
                                            <Label htmlFor="lubeName" className="text-[#020617]">
                                                Brand / Type <span className="text-red-500">*</span>
                                            </Label>
                                            <Controller
                                                name="lubeName"
                                                control={control}
                                                render={({ field }) => {
                                                    const volKey = Number(unitVolume);
                                                    const brandsMapForCategory = LUBE_BRANDS[lubeCategory as keyof typeof LUBE_BRANDS] as Record<number, readonly string[]>;

                                                    const volumePresets = LUBE_VOLUMES[lubeCategory as keyof typeof LUBE_VOLUMES] as readonly number[];
                                                    const isVolumePreset = volumePresets.includes(volKey);

                                                    let presets: string[] = [];
                                                    if (isVolumePreset) {
                                                        presets = (brandsMapForCategory[volKey] || []) as string[];
                                                    } else {
                                                        presets = Array.from(new Set(
                                                            Object.values(brandsMapForCategory).flat()
                                                        )).sort() as string[];
                                                    }

                                                    return (
                                                        <div className="space-y-2">
                                                            <Select
                                                                onValueChange={(val) => {
                                                                    if (val === "other") {
                                                                        setIsCustomBrand(true);
                                                                        field.onChange("");
                                                                    } else {
                                                                        setIsCustomBrand(false);
                                                                        field.onChange(val);
                                                                    }
                                                                }}
                                                                value={isCustomBrand ? "other" : (field.value || "")}
                                                            >
                                                                <SelectTrigger className="rounded-md">
                                                                    <SelectValue placeholder="Select brand" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {presets.map((brand) => (
                                                                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                                                    ))}
                                                                    <SelectItem value="other">Other</SelectItem>
                                                                </SelectContent>
                                                            </Select>

                                                            {isCustomBrand && (
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Enter brand / type name"
                                                                    onChange={(e) => field.onChange(e.target.value)}
                                                                    value={field.value || ""}
                                                                    className="mt-2"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                }}
                                            />
                                            {errors.lubeName && (
                                                <p className="text-sm text-red-500">{errors.lubeName.message}</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Quantity Field - Conditional */}
                            {fuelType === 'Lubricants' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="unitsQuantity" className="text-[#020617]">
                                        Quantity (Gallons/Packs) <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="unitsQuantity"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="unitsQuantity"
                                                type="number"
                                                placeholder="Enter number of gallons"
                                                className="rounded-md"
                                                min="0"
                                                step="any"
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                // Using valueAsNumber from event is cleaner for Controller with z.coerce, 
                                                // BUT standard text handling might be safer for backspace.
                                                // Let's stick to standard string passing and letting Zod coerce.
                                                value={field.value ?? ''}
                                                onChangeCapture={(e) => {
                                                    // Explicitly passing the raw string to handler 
                                                    // to avoid NaN issues with valueAsNumber during typing
                                                    const val = e.currentTarget.value;
                                                    field.onChange(val === '' ? undefined : val);
                                                }}
                                            />
                                        )}
                                    />
                                    {unitsQuantity && unitVolume && (
                                        <p className="text-xs text-green-600 font-medium">
                                            Total: {(Number(unitsQuantity) * Number(unitVolume)).toFixed(2)} Liters
                                        </p>
                                    )}
                                    {errors.unitsQuantity && (
                                        <p className="text-sm text-red-500">{errors.unitsQuantity.message}</p>
                                    )}
                                </div>
                            ) : (
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
                            )}

                            {/* Purchase Price Section */}
                            <div className="space-y-2">
                                <Label htmlFor="purchasePricePerLiter" className="text-[#020617]">
                                    {fuelType === 'Lubricants' ? 'Purchase Price Per Gallon (Rs.)' : 'Purchase Price Per Liter (Rs.)'} <span className="text-red-500">*</span>
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
                                    {fuelType === 'Lubricants' ? 'Sale Price Per Gallon (Rs.)' : 'Sale Price Per Liter (Rs.)'} <span className="text-red-500">*</span>
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
                                    max={new Date().toISOString().split('T')[0]}
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
                                {!imagePreview ? (
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-[#14b8a6] transition-colors cursor-pointer group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Upload className="h-8 w-8 mx-auto text-[#64748b] mb-2 group-hover:text-[#14b8a6]" />
                                        <p className="text-sm text-[#64748b] group-hover:text-[#14b8a6]">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-[#64748b] mt-1">
                                            PNG, JPG up to 5MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative w-full max-w-xs mx-auto border rounded-md overflow-hidden">
                                        <Image
                                            src={imagePreview}
                                            alt="Payment Proof"
                                            width={300}
                                            height={200}
                                            className="object-cover w-full h-48"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 rounded-full"
                                            onClick={removeImage}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
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
                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/admin/stock")}
                            className="rounded-md w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2 w-full sm:w-auto"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Add Stock Purchase
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AddStock;
