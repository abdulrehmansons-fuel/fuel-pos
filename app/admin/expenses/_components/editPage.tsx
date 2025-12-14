"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import {
  expenseEditSchema,
  type ExpenseEditFormData,
  EXPENSE_TYPES,
  PAYMENT_METHODS
} from "@/validators/expense";

const ExpenseEdit = ({ id }: { id: string }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [fuelPumps, setFuelPumps] = useState<string[]>([]);
  const [loadingPumps, setLoadingPumps] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseEditFormData>({
    resolver: zodResolver(expenseEditSchema),
    defaultValues: {
      expenseTitle: "",
      expenseType: undefined,
      amount: "",
      date: "",
      pump: undefined,
      paymentMethod: undefined,
      notes: "",
    },
  });

  // Fetch Data (Expense & Pumps)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expenseRes, pumpsRes] = await Promise.all([
          fetch(`/api/expenses/${id}`),
          fetch("/api/fuel-pumps")
        ]);

        if (pumpsRes.ok) {
          const pumpsData = await pumpsRes.json();
          setFuelPumps(pumpsData.map((p: any) => p.pumpName));
        } else {
          toast.error("Failed to load fuel pumps");
        }
        setLoadingPumps(false);

        if (expenseRes.ok) {
          const expenseData = await expenseRes.json();
          // Format date to YYYY-MM-DD for input
          const formattedDate = new Date(expenseData.date).toISOString().split('T')[0];

          reset({
            expenseTitle: expenseData.expenseTitle,
            expenseType: expenseData.expenseType as any,
            amount: String(expenseData.amount),
            date: formattedDate,
            pump: expenseData.pump as any,
            paymentMethod: expenseData.paymentMethod as any,
            notes: expenseData.notes || "",
          });
        } else {
          toast.error("Failed to load expense details");
          router.push("/admin/expenses");
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, reset, router]);


  const onSubmit = async (formData: ExpenseEditFormData) => {
    console.log("Updated Data:", formData);

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Expense updated successfully!");
        router.push(`/admin/expenses/${id}/view`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update expense");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f1f5f9]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b8a6]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/expenses/${id}/view`)}
          className="gap-2 rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold text-[#020617]">Edit Expense</h1>
      </div>

      {/* Form Card */}
      <Card className="p-6 bg-white border shadow-sm rounded-xl space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Section: Expense Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
              Expense Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="expenseTitle"
                  className="text-sm font-medium text-[#020617]"
                >
                  Expense Title / Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expenseTitle"
                  placeholder="Enter expense title"
                  className="rounded-md"
                  {...register("expenseTitle")}
                />
                {errors.expenseTitle && (
                  <p className="text-sm text-red-500">{errors.expenseTitle.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="expenseType"
                  className="text-sm font-medium text-[#020617]"
                >
                  Expense Type <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="expenseType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select expense type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.expenseType && (
                  <p className="text-sm text-red-500">{errors.expenseType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-[#020617]">
                  Amount (Rs.) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  className="rounded-md"
                  {...register("amount")}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-[#020617]">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  className="rounded-md"
                  max={new Date().toISOString().split('T')[0]}
                  {...register("date")}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Pump / Shop Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
              Pump / Shop Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pump" className="text-sm font-medium text-[#020617]">
                  Pump / Fuel Station <span className="text-red-500">*</span>
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
                        {fuelPumps.map((pump) => (
                          <SelectItem key={pump} value={pump}>{pump}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.pump && (
                  <p className="text-sm text-red-500">{errors.pump.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="paymentMethod"
                  className="text-sm font-medium text-[#020617]"
                >
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.paymentMethod && (
                  <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/expenses/${id}/view`)}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Expense"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ExpenseEdit;
