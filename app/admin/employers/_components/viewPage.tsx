"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

type EmployerData = {
  employerId: string; // Database ID
  displayId?: string; // Custom ID (EMP-XXX)
  fullName: string;
  email: string;
  mobile: string;
  address: string;
  fuelPump: string;
  status: "active" | "inactive";
  salary: string;
  advanceSalary?: string;
  joiningDate: string;
  notes?: string;
};

const EmployerView = ({ employerId }: { employerId: string }) => {
  const router = useRouter();
  const [employer, setEmployer] = useState<EmployerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEmployer = async () => {
      try {
        const res = await fetch(`/api/employers/${employerId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        // Map API response to UI model
        setEmployer({
          employerId: data._id,
          displayId: data.employerId, // Use custom ID if available
          fullName: data.fullName,
          email: data.email,
          mobile: data.mobile,
          address: data.address || "",
          fuelPump: data.fuelPump,
          status: data.status.toLowerCase(),
          salary: data.monthlySalary.toString(),
          advanceSalary: data.advanceSalary?.toString() || "",
          joiningDate: data.joiningDate,
          notes: data.notes || ""
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch employer");
        router.push("/admin/employers");
      } finally {
        setLoading(false);
      }
    };
    if (employerId) fetchEmployer();
  }, [employerId, router]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/employers/${employerId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Employer deleted successfully");
        router.push("/admin/employers");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete employer");
      }
    } catch (error) {
      console.error("Error deleting employer:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6]"></div>
      </div>
    );
  }

  if (!employer) {
    return <div>Employer not found</div>;
  }

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Top Bar */}
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
          <h1 className="text-xl font-semibold text-[#020617]">Employer Details</h1>
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
                  This action cannot be undone. This will permanently delete this employer from the database.
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
            onClick={() => router.push(`/admin/employers/${employer.employerId}/edit`)}
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2"
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Details Card */}
      <Card className="p-6 bg-white shadow-sm border rounded-xl space-y-6">
        {/* Section: Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
                Employer ID
              </span>
              <span className="text-base text-[#020617] font-semibold">
                {employer.displayId || employer.employerId.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
                Full Name
              </span>
              <span className="text-base text-[#020617] font-semibold">
                {employer.fullName}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
                Email
              </span>
              <span className="text-base text-[#020617] font-semibold">
                {employer.email}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
                Mobile Number
              </span>
              <span className="text-base text-[#020617] font-semibold">
                {employer.mobile}
              </span>
            </div>

            <div className="flex flex-col sm:col-span-2">
              <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
                Address
              </span>
              <span className="text-base text-[#020617] font-semibold">
                {employer.address || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Employment Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">
            Employment Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
                Fuel Pump
              </span>
              <span className="text-base text-[#020617] font-semibold">
                {employer.fuelPump}
              </span>
            </div>

            <div className="flex flex-col">
            </div>

            <div className="flex flex-col">
              <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
                Monthly Salary (Rs.)
              </span>
              <span className="text-base text-[#020617] font-semibold">
                {Number(employer.salary).toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
                Advance Salary (Rs.)
              </span>
              <span className="text-base text-[#020617] font-semibold">
                {employer.advanceSalary ? Number(employer.advanceSalary).toLocaleString() : "—"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
                Joining Date
              </span>
              <span className="text-base text-[#020617] font-semibold">
                {new Date(employer.joiningDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Notes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#020617] border-b pb-2">Notes</h2>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-[#64748b] font-medium mb-1">
              Additional Notes
            </span>
            <span className="text-base text-[#64748b]">
              {employer.notes || "No additional notes"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmployerView;
