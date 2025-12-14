"use client";

import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fuelPumpAddSchema, type FuelPumpAddFormData, PUMP_STATUS, FUEL_TYPE_OPTIONS } from "@/validators/fuelpump";

const employeeOptions = [
    { id: "emp-001", name: "Ahmed Khan" },
    { id: "emp-002", name: "Ali Hassan" },
    { id: "emp-003", name: "Bilal Ahmed" },
    { id: "emp-004", name: "Usman Tariq" },
    { id: "emp-005", name: "Faisal Malik" },
];

const AddFuelPump = () => {
    const router = useRouter();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<FuelPumpAddFormData>({
        resolver: zodResolver(fuelPumpAddSchema),
        defaultValues: {
            pumpName: "",
            location: "",
            status: undefined,
            totalNozzles: "",
            selectedFuelTypes: [],
            selectedEmployees: [],
            notes: "",
        },
    });

    const onSubmit = (data: FuelPumpAddFormData) => {
        console.log("Form Data:", data);
        toast({
            title: "Fuel Pump Added",
            description: "The fuel pump has been added successfully.",
        });
        router.push("/admin/FuelPumps");
    };

    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            {/* Back Button + Title */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="outline"
                    onClick={() => router.push("/admin/FuelPumps")}
                    className="rounded-md"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-xl font-semibold text-[#020617]">Add Fuel Pump</h1>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                                    id={fuel}
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
                                                    htmlFor={fuel}
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

                    {/* Section 3: Assigned Employees */}
                    <div className="mt-6">
                        <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-4">
                            Assigned Employees (Optional)
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <Controller
                                name="selectedEmployees"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        {employeeOptions.map((emp) => (
                                            <div key={emp.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={emp.id}
                                                    checked={field.value?.includes(emp.id)}
                                                    onCheckedChange={(checked) => {
                                                        const current = field.value || [];
                                                        const updated = checked
                                                            ? [...current, emp.id]
                                                            : current.filter((val) => val !== emp.id);
                                                        field.onChange(updated);
                                                    }}
                                                    className="border-[#64748b] data-[state=checked]:bg-[#14b8a6] data-[state=checked]:border-[#14b8a6]"
                                                />
                                                <Label
                                                    htmlFor={emp.id}
                                                    className="text-sm text-[#020617] cursor-pointer"
                                                >
                                                    {emp.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </>
                                )}
                            />
                        </div>
                    </div>

                    {/* Section 4: Notes */}
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
                            onClick={() => router.push("/admin/FuelPumps")}
                            className="rounded-md"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md"
                        >
                            {isSubmitting ? "Adding..." : "Add Fuel Pump"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AddFuelPump;
