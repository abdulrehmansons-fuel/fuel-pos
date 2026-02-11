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
  stockEditSchema,
  type StockEditFormData,
  FUEL_TYPES,
  PAYMENT_TYPES,
  LUBE_CATEGORIES,
  LUBE_VOLUMES,
  LUBE_BRANDS
} from "@/validators/stock";
import Image from "next/image";

type StockData = {
  _id: string; // Use _id from backend
  fuelType: string;
  quantity: number;
  purchasePricePerLiter: number;
  salePricePerLiter: number;
  purchaseDate: string;
  supplier: string;
  paymentType: string;
  notes: string;
  pump: string;
  paymentProofImage?: string;
  lubeCategory?: string;
  unitVolume?: number;
  lubeName?: string;
  unitsQuantity?: number;
};

const StockEdit = ({ id }: { id: string }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StockData | null>(null);
  const [pumps, setPumps] = useState<{ _id: string, pumpName: string }[]>([]);
  const [loadingPumps, setLoadingPumps] = useState(true);

  // Separate state for "Add New Quantity"
  const [addQty, setAddQty] = useState<string>("");

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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockEditFormData>({
    resolver: zodResolver(stockEditSchema),
    defaultValues: {
      fuelType: "Petrol", // Default, will be overridden
      quantity: "0",
      purchasePricePerLiter: "0",
      salePricePerLiter: "0",
      purchaseDate: new Date().toISOString().split('T')[0],
      supplier: "",
      paymentType: "Cash",
      notes: "",
      pump: "",
      paymentProofImage: "",
      lubeCategory: undefined,
      unitVolume: undefined,
      lubeName: undefined,
      unitsQuantity: undefined,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockRes, pumpsRes] = await Promise.all([
          fetch(`/api/stocks/${id}`),
          fetch("/api/fuel-pumps")
        ]);

        if (stockRes.ok) {
          const stockData = await stockRes.json();
          setData(stockData);
          // Reset form with fetched data
          reset({
            fuelType: stockData.fuelType,
            quantity: stockData.quantity.toString(),
            // If Lube, convert Per Liter to Per Gallon for display
            purchasePricePerLiter: (stockData.fuelType === 'Lubricants' && stockData.unitVolume)
              ? (stockData.purchasePricePerLiter * stockData.unitVolume).toFixed(2)
              : stockData.purchasePricePerLiter.toString(),
            salePricePerLiter: (stockData.fuelType === 'Lubricants' && stockData.unitVolume)
              ? (stockData.salePricePerLiter * stockData.unitVolume).toFixed(2)
              : stockData.salePricePerLiter.toString(),
            purchaseDate: stockData.purchaseDate ? new Date(stockData.purchaseDate).toISOString().split('T')[0] : "",
            supplier: stockData.supplier,
            paymentType: stockData.paymentType,
            notes: stockData.notes,
            pump: stockData.pump,
            paymentProofImage: stockData.paymentProofImage || "",
            // Lube fields
            lubeCategory: stockData.lubeCategory,
            unitVolume: stockData.unitVolume,
            lubeName: stockData.lubeName,
            unitsQuantity: stockData.unitsQuantity,
          });
          if (stockData.paymentProofImage) {
            setImagePreview(stockData.paymentProofImage);
          }
          if (stockData.lubeCategory) {
            const volumePresets = LUBE_VOLUMES[stockData.lubeCategory as keyof typeof LUBE_VOLUMES] as readonly number[] || [];
            const isVolPreset = volumePresets.includes(stockData.unitVolume);
            if (stockData.unitVolume && !isVolPreset) {
              setIsCustomVolume(true);
            }

            const brandsMap = LUBE_BRANDS[stockData.lubeCategory as keyof typeof LUBE_BRANDS] as Record<number, readonly string[]> || {};
            let brandPresets: string[] = [];
            if (isVolPreset) {
              brandPresets = (brandsMap[stockData.unitVolume] || []) as string[];
            } else {
              brandPresets = Array.from(new Set(Object.values(brandsMap).flat())).sort() as string[];
            }

            if (stockData.lubeName && !brandPresets.includes(stockData.lubeName)) {
              setIsCustomBrand(true);
            }
          }
        } else {
          toast.error("Failed to load stock details");
          router.push("/admin/stock");
        }

        if (pumpsRes.ok) {
          const pumpsData = await pumpsRes.json();
          setPumps(pumpsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
        setLoadingPumps(false);
      }
    };
    fetchData();
  }, [id, router, reset]);


  // Watch fields
  const fuelType = useWatch({ control, name: "fuelType" });
  const lubeCategory = useWatch({ control, name: "lubeCategory" });
  const unitVolume = useWatch({ control, name: "unitVolume" });

  // Update total quantity whenever user types in "Add Quantity"
  useEffect(() => {
    if (data) {
      const existing = parseFloat(data.quantity.toString()) || 0;
      const added = parseFloat(addQty) || 0;

      let additionalLiters = added;
      // If Lubricant, input is in Gallons, so convert to Liters
      if (fuelType === 'Lubricants' && unitVolume) {
        additionalLiters = added * Number(unitVolume);

        // Also update unitsQuantity (Total Gallons)
        // existing is Liters.
        const existingPacks = existing / Number(unitVolume);
        const totalPacks = existingPacks + added;
        setValue("unitsQuantity", Number(totalPacks.toFixed(2)));
      }

      setValue("quantity", (existing + additionalLiters).toFixed(2));
    }
  }, [addQty, data, setValue, fuelType, unitVolume]);

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


  const quantity = useWatch({ control, name: "quantity" });
  const purchasePricePerLiter = useWatch({ control, name: "purchasePricePerLiter" });
  const salePricePerLiter = useWatch({ control, name: "salePricePerLiter" });

  const totalPurchaseAmount =
    quantity && purchasePricePerLiter && !isNaN(Number(quantity)) && !isNaN(Number(purchasePricePerLiter))
      ? (fuelType === 'Lubricants' && unitVolume
        ? (parseFloat(quantity) * (parseFloat(purchasePricePerLiter) / Number(unitVolume))).toFixed(2)
        : (parseFloat(quantity) * parseFloat(purchasePricePerLiter)).toFixed(2))
      : "0.00";

  const totalSaleAmount =
    quantity && salePricePerLiter && !isNaN(Number(quantity)) && !isNaN(Number(salePricePerLiter))
      ? (fuelType === 'Lubricants' && unitVolume
        ? (parseFloat(quantity) * (parseFloat(salePricePerLiter) / Number(unitVolume))).toFixed(2)
        : (parseFloat(quantity) * parseFloat(salePricePerLiter)).toFixed(2))
      : "0.00";

  const onSubmit = async (formData: StockEditFormData) => {
    try {
      const formattedData = { ...formData };

      // If Lubricant, convert Price Per Gallon -> Price Per Liter
      if (formattedData.fuelType === 'Lubricants' && formattedData.unitVolume) {
        const vol = Number(formattedData.unitVolume);
        if (vol > 0) {
          formattedData.purchasePricePerLiter = (Number(formData.purchasePricePerLiter) / vol).toFixed(2);
          formattedData.salePricePerLiter = (Number(formData.salePricePerLiter) / vol).toFixed(2);
        }
      }

      const res = await fetch(`/api/stocks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      if (res.ok) {
        toast.success(`${formData.fuelType} purchase has been updated successfully.`);
        router.push(`/admin/stock/${id}/view`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update stock");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b8a6]"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col">
      {/* Back Button + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/stock/${id}/view`)}
          className="rounded-md"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-semibold text-[#020617]">Edit Stock Purchase</h1>
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
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
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
                        }} value={field.value}>
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
                        Volume (Gallon Size) <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="unitVolume"
                        control={control}
                        render={({ field }) => {
                          const presets = LUBE_VOLUMES[lubeCategory as keyof typeof LUBE_VOLUMES] as readonly number[] || [];
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
                          const brandsMapForCategory = LUBE_BRANDS[lubeCategory as keyof typeof LUBE_BRANDS] as Record<number, readonly string[]> || {};

                          const volumePresets = LUBE_VOLUMES[lubeCategory as keyof typeof LUBE_VOLUMES] as readonly number[] || [];
                          const isVolumePreset = volumePresets.includes(volKey);

                          let presets: string[] = [];
                          if (isVolumePreset) {
                            presets = (brandsMapForCategory[volKey] || []) as string[];
                          } else {
                            presets = Array.from(new Set(Object.values(brandsMapForCategory).flat())).sort() as string[];
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

              {/* Special Quantity Logic */}
              <div className="space-y-2">
                <Label className="text-[#020617]">
                  {fuelType === 'Lubricants' ? 'Existing Quantity (Gallons)' : 'Existing Quantity (Liters)'}
                </Label>
                <Input
                  disabled
                  value={
                    fuelType === 'Lubricants' && unitVolume
                      ? (data.quantity / unitVolume).toFixed(2)
                      : data.quantity
                  }
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#020617]">
                  {fuelType === 'Lubricants' ? 'Add New Stock (Gallons)' : 'Add New Stock (Liters)'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder={fuelType === 'Lubricants' ? "e.g. 10 (Gallons)" : "e.g. 500 (Liters)"}
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  className="border-green-300 focus:border-green-500"
                />
                <p className="text-xs text-gray-500">
                  {fuelType === 'Lubricants' && unitVolume
                    ? `Adding ${(Number(addQty) * Number(unitVolume)).toFixed(2)} Liters to existing stock.`
                    : "Enter amount to ADD to existing stock."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-[#020617]">
                  {fuelType === 'Lubricants' ? 'Total Quantity (Result in Liters)' : 'Total Quantity (Result)'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  className="rounded-md bg-gray-50 font-bold"
                  readOnly // Mostly read-only as it is calculated, but technically form sends it
                  min="0"
                  step="0.01"
                  {...register("quantity")}
                />
                {fuelType === 'Lubricants' && unitVolume && quantity && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Equivalent to {(Number(quantity) / unitVolume).toFixed(2)} Gallons
                  </p>
                )}
                {errors.quantity && (
                  <p className="text-sm text-red-500">{errors.quantity.message}</p>
                )}
              </div>

              {/* Purchase Price Section */}
              <div className="space-y-2">
                <Label htmlFor="purchasePricePerLiter" className="text-[#020617]">
                  {fuelType === 'Lubricants' ? 'Purchase Price Per Gallon/Pack (Rs.)' : 'Purchase Price Per Liter (Rs.)'} <span className="text-red-500">*</span>
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

              {/* Sale Price Date */}
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
              onClick={() => router.push(`/admin/stock/${data._id}/view`)}
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
                  Update Purchase
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StockEdit;
