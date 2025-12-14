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
import {
  expenseAddSchema,
  type ExpenseAddFormData,
  EXPENSE_TYPES,
  FUEL_PUMPS,
  PAYMENT_METHODS
} from "@/validators/expense";

const AddExpense = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseAddFormData>({
    resolver: zodResolver(expenseAddSchema),
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

  const onSubmit = (data: ExpenseAddFormData) => {
    console.log("Form Data:", data);
    // Here you would typically make an API call
    toast.success("Expense added successfully!");
    router.push("/admin/expenses");
  };

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/expenses")}
          className="gap-2 rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold text-[#020617]">Add Expense</h1>
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
                        <SelectValue placeholder="Select pump" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_PUMPS.map((pump) => (
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
              onClick={() => router.push("/admin/expenses")}
              className="rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2"
            >
              {isSubmitting ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddExpense;
