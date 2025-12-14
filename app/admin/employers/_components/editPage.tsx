"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employerEditSchema, type EmployerEditFormData, EMPLOYER_STATUS, FUEL_PUMPS } from "@/validators/employer";

// Helper type to map incoming data to form data
// The incoming data might have different field names or types (e.g. salary vs monthlySalary)
// We need to ensure we pass correct default values
type EmployerData = {
  fullName: string;
  email: string;
  username?: string;
  password?: string;
  mobile: string;
  address?: string;
  fuelPump?: string;
  status: string;
  salary: string; // mapped to monthlySalary
  advanceSalary?: string;
  joiningDate: string;
  notes?: string;
};

const EmployerEdit = ({ data }: { data: EmployerData }) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmployerEditFormData>({
    resolver: zodResolver(employerEditSchema),
    defaultValues: {
      fullName: data.fullName,
      email: data.email,
      username: data.username || "",
      password: "", // Password typically empty on edit unless changing
      mobile: data.mobile,
      address: data.address || "",
      status: data.status as any, // Cast or map if needed
      fuelPump: data.fuelPump as any, // Cast or map if needed
      monthlySalary: data.salary, // Map salary to monthlySalary
      advanceSalary: data.advanceSalary || "",
      joiningDate: data.joiningDate,
      notes: data.notes || "",
    },
  });

  const onSubmit = (formData: EmployerEditFormData) => {
    // Validation handled by handleSubmit
    console.log("Updated Data:", formData);

    // Mock update logic
    toast.success("Employer updated successfully!");
    router.push("/admin/employers");
  };

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Top Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/employers")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-[#020617]">Edit Employer</h1>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2"
        >
          {isSubmitting ? "Updating..." : "Update Employer"}
        </Button>
      </div>

      {/* Form Card */}
      <Card className="p-6 border shadow-sm bg-white rounded-xl space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Section: Personal Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-[#020617]">
                  Full Name <span className="text-red-500">*</span>
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#020617]">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  className="rounded-md"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-[#020617]">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="Enter username (optional)"
                  className="rounded-md"
                  {...register("username")}
                />
                <p className="text-xs text-muted-foreground">Leave blank to keep current username</p>
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#020617]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password (optional)"
                  className="rounded-md"
                  {...register("password")}
                />
                <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium text-[#020617]">
                  Mobile Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mobile"
                  placeholder="Enter mobile number"
                  className="rounded-md"
                  {...register("mobile")}
                />
                {errors.mobile && (
                  <p className="text-sm text-red-500">{errors.mobile.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address" className="text-sm font-medium text-[#020617]">
                  Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter address"
                  className="rounded-md"
                  rows={3}
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Employment Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
              Employment Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-[#020617]">
                  Status <span className="text-red-500">*</span>
                </Label>
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
                          <SelectItem key={status} value={status}>{status}</SelectItem>
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
                <Label htmlFor="fuelPump" className="text-sm font-medium text-[#020617]">
                  Fuel Pump <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="fuelPump"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select fuel pump" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_PUMPS.map((pump) => (
                          <SelectItem key={pump} value={pump}>{pump}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.fuelPump && (
                  <p className="text-sm text-red-500">{errors.fuelPump.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlySalary" className="text-sm font-medium text-[#020617]">
                  Monthly Salary (Rs.) <span className="text-red-500">*</span>
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="advanceSalary" className="text-sm font-medium text-[#020617]">
                  Advance Salary (Rs.)
                </Label>
                <Input
                  id="advanceSalary"
                  type="number"
                  placeholder="Enter advance salary"
                  className="rounded-md"
                  {...register("advanceSalary")}
                />
                {errors.advanceSalary && (
                  <p className="text-sm text-red-500">{errors.advanceSalary.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="joiningDate" className="text-sm font-medium text-[#020617]">
                  Joining Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="joiningDate"
                  type="date"
                  className="rounded-md"
                  {...register("joiningDate")}
                />
                {errors.joiningDate && (
                  <p className="text-sm text-red-500">{errors.joiningDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">Notes</h2>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-[#020617]">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes"
                className="rounded-md"
                rows={4}
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-red-500">{errors.notes.message}</p>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/employers")}
              className="rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md"
            >
              Update Employer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EmployerEdit;
