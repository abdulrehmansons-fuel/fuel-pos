"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fuelPumpEditSchema, type FuelPumpEditFormData, PUMP_STATUS, FUEL_TYPE_OPTIONS } from "@/validators/fuelpump";

const FuelPumpEdit = ({ pumpId }: { pumpId: string }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FuelPumpEditFormData>({
        resolver: zodResolver(fuelPumpEditSchema),
        defaultValues: {
            pumpName: "",
            location: "",
            status: undefined,
            totalNozzles: "",
            selectedFuelTypes: [],
            selectedEmployees: [], // default
            notes: "",
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Pump Details Only (Employees removed)
                const pumpRes = await fetch(`/api/fuel-pumps/${pumpId}`);
                if (!pumpRes.ok) {
                    throw new Error("Failed to fetch fuel pump details");
                }
                const pump = await pumpRes.json();

                // 2. Reset Form with Data
                reset({
                    pumpName: pump.pumpName,
                    location: pump.location || "",
                    status: pump.status,
                    totalNozzles: String(pump.totalNozzles),
                    selectedFuelTypes: pump.fuelProducts || [],
                    selectedEmployees: pump.assignedEmployees || [], // Keep value if it exists but no UI
                    notes: pump.notes || "",
                });
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load fuel pump data.");
            } finally {
                setLoading(false);
            }
        };

        if (pumpId) fetchData();
    }, [pumpId, reset]);

    const onSubmit = async (formData: FuelPumpEditFormData) => {
        try {
            const res = await fetch(`/api/fuel-pumps/${pumpId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update fuel pump");
            }

            toast.success("Fuel pump updated successfully.");
            router.push(`/admin/FuelPumps/${pumpId}/view`);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            {/* Back Button + Title */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/FuelPumps/${pumpId}/view`)}
                    className="rounded-md"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-xl font-semibold text-[#020617]">Edit Fuel Pump</h1>
            </div>

            {/* Form Card */}
            <Card className="p-6 bg-white shadow-sm border rounded-xl space-y-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Section 1: Basic Information */}
                    <div>
                        <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-4">
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pumpName" className="text-[#020617]">
                                    Pump Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="pumpName"
                                    placeholder="Enter pump name"
                                    className="bg-white border rounded-md"
                                    {...register("pumpName")}
                                />
                                {errors.pumpName && (
                                    <p className="text-sm text-red-500">{errors.pumpName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-[#020617]">
                                    Location
                                </Label>
                                <Input
                                    id="location"
                                    placeholder="Enter location (optional)"
                                    className="bg-white border rounded-md"
                                    {...register("location")}
                                />
                                {errors.location && (
                                    <p className="text-sm text-red-500">{errors.location.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-[#020617]">
                                    Status <span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="bg-white border rounded-md">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border rounded-md shadow-lg z-50">
                                                {PUMP_STATUS.map(status => (
                                                    <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.status && (
                                    <p className="text-sm text-red-500">{errors.status.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalNozzles" className="text-[#020617]">
                                    Total Nozzles <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="totalNozzles"
                                    type="number"
                                    placeholder="Enter number of nozzles"
                                    className="bg-white border rounded-md"
                                    min="1"
                                    {...register("totalNozzles")}
                                />
                                {errors.totalNozzles && (
                                    <p className="text-sm text-red-500">{errors.totalNozzles.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Fuel Types */}
                    <div className="mt-6">
                        <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-4">
                            Fuel Types Available
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Controller
                                name="selectedFuelTypes"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        {FUEL_TYPE_OPTIONS.map((fuel) => (
                                            <div key={fuel} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`edit-${fuel}`}
                                                    checked={field.value?.includes(fuel)}
                                                    onCheckedChange={(checked) => {
                                                        const current = field.value || [];
                                                        const updated = checked
                                                            ? [...current, fuel]
                                                            : current.filter((val) => val !== fuel);
                                                        field.onChange(updated);
                                                    }}
                                                    className="border-[#64748b] data-[state=checked]:bg-[#14b8a6] data-[state=checked]:border-[#14b8a6]"
                                                />
                                                <Label
                                                    htmlFor={`edit-${fuel}`}
                                                    className="text-sm text-[#020617] cursor-pointer capitalize"
                                                >
                                                    {fuel.replace('-', ' ')}
                                                </Label>
                                            </div>
                                        ))}
                                    </>
                                )}
                            />
                        </div>
                    </div>

                    {/* Section 3: Notes */}
                    <div className="mt-6">
                        <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-4">
                            Notes
                        </h2>
                        <Textarea
                            placeholder="Add any additional notes..."
                            className="bg-white border rounded-md min-h-[100px]"
                            {...register("notes")}
                        />
                        {errors.notes && (
                            <p className="text-sm text-red-500">{errors.notes.message}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push(`/admin/FuelPumps/${pumpId}/view`)}
                            className="rounded-md"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                    Updating...
                                </>
                            ) : "Update Fuel Pump"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default FuelPumpEdit;
