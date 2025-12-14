"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { toast } from "sonner";

type StockViewData = {
  _id: string;
  fuelType: string;
  quantity: number;
  purchasePricePerLiter: number;
  salePricePerLiter: number;
  supplier: string;
  paymentType: string;
  purchaseDate: string;
  notes: string;
  pump: string;
};

const StockView = ({ id }: { id: string }) => {
  const router = useRouter();
  const [data, setData] = useState<StockViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch(`/api/stocks/${id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          toast.error("Failed to load stock details");
          router.push("/admin/stock");
        }
      } catch (error) {
        console.error("Error fetching stock:", error);
        toast.error("Failed to load stock details");
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [id, router]);

  const formatCurrency = (value: number) => {
    return `Rs. ${value.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = async () => {
    if (!data) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/stocks/${data._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Stock entry deleted successfully");
        router.push("/admin/stock");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete entry");
      }
    } catch (error) {
      console.error("Error deleting stock:", error);
      toast.error("Failed to delete entry");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f1f5f9]">
        <Loader2 className="h-10 w-10 animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/stock")}
            className="gap-2 rounded-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-[#020617]">
            Stock Purchase Details
          </h1>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2 rounded-md">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this stock entry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={() => router.push(`/admin/stock/${data._id}/edit`)}
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2 gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Details Card */}
      <Card className="p-6 bg-white border shadow-sm rounded-xl space-y-6">
        {/* Section 1: Fuel Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
            Fuel Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Stock ID
              </span>
              <span className="text-base text-[#020617] font-medium">
                {data._id.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Fuel Type
              </span>
              <span className="text-base text-[#020617] font-medium">
                {data.fuelType}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Pump / Station
              </span>
              <span className="text-base text-[#020617] font-medium">
                {data.pump || "N/A"}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Quantity (Liters)
              </span>
              <span className="text-base text-[#020617] font-medium">
                {data.quantity.toLocaleString()} L
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Price Per Liter
              </span>
              <span className="text-base text-[#020617] font-medium">
                {formatCurrency(data.purchasePricePerLiter)}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Total Purchase Amount
              </span>
              <span className="text-base text-[#14b8a6] font-semibold">
                {formatCurrency(data.quantity * data.purchasePricePerLiter)}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Sale Price Per Liter
              </span>
              <span className="text-base text-[#020617] font-medium">
                {formatCurrency(data.salePricePerLiter)}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Purchase Date
              </span>
              <span className="text-base text-[#020617] font-medium">
                {formatDate(data.purchaseDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Purchase Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
            Purchase Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Purchase Company / Supplier
              </span>
              <span className="text-base text-[#020617] font-medium">
                {data.supplier || "—"}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-xs uppercase text-[#64748b] tracking-wide">
                Payment Type
              </span>
              <span className="text-base text-[#020617] font-medium">
                {data.paymentType || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Notes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
            Notes
          </h2>
          <div className="flex flex-col space-y-1">
            <span className="text-xs uppercase text-[#64748b] tracking-wide">
              Additional Notes
            </span>
            <span className="text-base text-[#64748b]">
              {data.notes || "—"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StockView;
