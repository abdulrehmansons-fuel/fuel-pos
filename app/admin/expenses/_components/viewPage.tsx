"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ExpenseData = {
  id: string; // real ID
  displayId: string; // Fake ID formatted
  name: string;
  type: string;
  amount: number;
  pump: string;
  date: string;
  paymentMethod: string;
  createdBy?: string;
  notes?: string;
};

const ExpenseView = ({ id }: { id: string }) => {
  const router = useRouter();
  const [expense, setExpense] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const res = await fetch(`/api/expenses/${id}`);
        if (res.ok) {
          const data = await res.json();
          setExpense({
            id: data._id,
            displayId: data._id.substring(0, 6).toUpperCase(),
            name: data.expenseTitle,
            type: data.expenseType,
            amount: data.amount,
            pump: data.pump,
            date: data.date,
            paymentMethod: data.paymentMethod,
            notes: data.notes
          });
        } else {
          toast.error("Failed to load expense details");
          router.push("/admin/expenses");
        }
      } catch (error) {
        console.error("Error fetching expense:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchExpense();
  }, [id, router]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Expense deleted successfully");
        router.push("/admin/expenses");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f1f5f9]">
        <Loader2 className="h-10 w-10 animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  if (!expense) return null;

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/expenses")}
            className="gap-2 rounded-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-[#020617]">Expense Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2 rounded-md bg-red-600 hover:bg-red-700 text-white" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this expense from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={() => router.push(`/admin/expenses/${expense.id}/edit`)}
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2"
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Details Card */}
      <Card className="p-6 bg-white border shadow-sm rounded-xl space-y-6">
        {/* Section: Basic Expense Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
            Basic Expense Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Expense ID
              </span>
              <span className="text-base text-[#020617] font-medium">
                {expense.displayId}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Expense Name / Title
              </span>
              <span className="text-base text-[#020617] font-medium">
                {expense.name}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Expense Type
              </span>
              <span className="text-base text-[#020617] font-medium">
                {expense.type}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Amount (Rs.)
              </span>
              <span className="text-base text-[#020617] font-medium">
                {expense.amount.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Date
              </span>
              <span className="text-base text-[#020617] font-medium">
                {new Date(expense.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Shop / Payment Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
            Shop / Payment Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Pump / Fuel Station Name
              </span>
              <span className="text-base text-[#020617] font-medium">
                {expense.pump}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Payment Method
              </span>
              <span className="text-base text-[#020617] font-medium">
                {expense.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Notes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">Notes</h2>
          <div className="flex flex-col space-y-1">
            <span className="text-xs uppercase text-[#64748b] tracking-wide">
              Additional Notes
            </span>
            <span className="text-base text-[#64748b]">
              {expense.notes || "—"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExpenseView;
