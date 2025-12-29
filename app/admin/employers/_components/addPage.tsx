"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employerAddSchema, type EmployerAddFormData, EMPLOYER_STATUS } from "@/validators/employer";

const AddEmployer = () => {
  const router = useRouter();
  const [fuelPumps, setFuelPumps] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmployerAddFormData>({
    resolver: zodResolver(employerAddSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      password: "",
      mobile: "",
      address: "",
      monthlySalary: "",
      advanceSalary: "",
      joiningDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchPumps = async () => {
      try {
        const res = await fetch("/api/fuel-pumps");
        if (res.ok) {
          const data = await res.json();
          // Assuming pumpName is unique and what we want to display/store
          setFuelPumps(data.map((p: { pumpName: string }) => p.pumpName));
        }
      } catch (error) {
        console.error("Failed to fetch pumps", error);
      }
    };
    fetchPumps();
  }, []);

  const onSubmit = async (data: EmployerAddFormData) => {
    try {
      const response = await fetch("/api/employers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add employer");
      }

      toast.success("Employer added successfully!");
      router.push("/admin/employers");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Top Bar - Back Button + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/employers")}
          className="rounded-md"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold text-[#020617]">Add Employer</h1>
      </div>

      {/* Employer Form Card */}
      <Card className="p-6 border shadow-sm bg-white rounded-xl space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Section 1: Personal Information */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#020617] border-b pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter full name"
                  className="rounded-md"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  className="rounded-md"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  className="rounded-md"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  className="rounded-md"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  className="rounded-md"
                  {...register("mobile")}
                />
                {errors.mobile && (
                  <p className="text-sm text-red-500">{errors.mobile.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter full address"
                  className="rounded-md min-h-[80px]"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Employment Details */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#020617] border-b pb-2">
              Employment Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="status">Status *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYER_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="fuelPump">Fuel Pump *</Label>
                <Controller
                  name="fuelPump"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select fuel pump" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelPumps.length === 0 ? (
                          <p className="p-2 text-sm text-gray-500">No pumps available</p>
                        ) : (
                          fuelPumps.map((pump) => (
                            <SelectItem key={pump} value={pump}>
                              {pump}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.fuelPump && (
                  <p className="text-sm text-red-500">{errors.fuelPump.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="monthlySalary">Monthly Salary (Rs.) *</Label>
                <Input
                  id="monthlySalary"
                  type="number"
                  placeholder="Enter monthly salary"
                  className="rounded-md"
                  {...register("monthlySalary")}
                />
                {errors.monthlySalary && (
                  <p className="text-sm text-red-500">{errors.monthlySalary.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="advanceSalary">Advance Salary (Rs.)</Label>
                <Input
                  id="advanceSalary"
                  type="number"
                  placeholder="Enter advance amount (optional)"
                  className="rounded-md"
                  {...register("advanceSalary")}
                />
                {errors.advanceSalary && (
                  <p className="text-sm text-red-500">{errors.advanceSalary.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="joiningDate">Joining Date *</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  className="rounded-md"
                  max={new Date().toISOString().split('T')[0]}
                  {...register("joiningDate")}
                />
                {errors.joiningDate && (
                  <p className="text-sm text-red-500">{errors.joiningDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#020617] border-b pb-2">
              Notes
            </h2>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or comments (optional)"
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
              onClick={() => router.push("/admin/employers")}
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
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Adding...
                </>
              ) : (
                "Add Employer"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddEmployer;
