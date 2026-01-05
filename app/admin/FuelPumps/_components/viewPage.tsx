"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash, Loader2 } from "lucide-react";
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

type FuelPumpData = {
    id: string; // db _id
    name: string;
    location: string;
    status: "Active" | "Inactive";
    totalNozzles: number;
    fuelTypes: string[];
    nozzles: {
        name: string;
        fuelType: string;
        openingReading: number;
    }[];
    assignedEmployees: string[];
    notes: string;
};

type NozzlePerformance = {
    id: string;
    name: string;
    fuelType: string;
    tillYesterday: number;
    todaySale: number;
    total: number;
};

const FuelPumpView = ({ pumpId }: { pumpId: string }) => {
    const router = useRouter();
    const [data, setData] = useState<FuelPumpData | null>(null);
    const [performance, setPerformance] = useState<NozzlePerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchPumpAndSales = async () => {
            try {
                // 1. Fetch Pump Details
                const pumpRes = await fetch(`/api/fuel-pumps/${pumpId}`);
                if (!pumpRes.ok) {
                    toast.error("Failed to fetch pump details");
                    router.push("/admin/FuelPumps");
                    return;
                }
                const pump = await pumpRes.json();

                const pumpData: FuelPumpData = {
                    id: pump._id,
                    name: pump.pumpName,
                    location: pump.location || "—",
                    status: pump.status === "active" ? "Active" : "Inactive",
                    totalNozzles: pump.totalNozzles,
                    fuelTypes: pump.fuelProducts || [],
                    nozzles: pump.nozzles || [],
                    assignedEmployees: pump.assignedEmployees || [],
                    notes: pump.notes || ""
                };
                setData(pumpData);

                // 2. Fetch Approved Sales for this pump
                const salesRes = await fetch(`/api/sales?pumpId=${pumpId}&status=Approved`);
                if (salesRes.ok) {
                    const sales = await salesRes.json();
                    calculatePerformance(pumpData.nozzles, sales);
                }
            } catch (error) {
                console.error("Error fetching pump or sales:", error);
                toast.error("An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        };

        interface SaleItem {
            nozzleId?: string;
            quantityInLiters?: number;
            quantity?: number;
        }

        interface Sale {
            createdAt: string;
            items: SaleItem[];
        }

        const calculatePerformance = (nozzles: FuelPumpData["nozzles"], sales: Sale[]) => {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

            const perf = nozzles.map(nozzle => {
                let tillYesterdaySales = 0;
                let todaySales = 0;

                sales.forEach(sale => {
                    const saleDate = new Date(sale.createdAt);
                    const saleDateStr = saleDate.toISOString().split('T')[0];

                    sale.items.forEach((item: SaleItem) => {
                        // Match nozzle name or ID
                        if (item.nozzleId === nozzle.name) {
                            const qty = item.quantityInLiters || item.quantity || 0;
                            if (saleDateStr < todayStr) {
                                tillYesterdaySales += qty;
                            } else if (saleDateStr === todayStr) {
                                todaySales += qty;
                            } else {
                                // For future sales (if any), count as today for now or ignore
                                todaySales += qty;
                            }
                        }
                    });
                });

                return {
                    id: (nozzle as any)._id || "",
                    name: nozzle.name,
                    fuelType: nozzle.fuelType,
                    tillYesterday: nozzle.openingReading + tillYesterdaySales,
                    todaySale: todaySales,
                    total: nozzle.openingReading + tillYesterdaySales + todaySales
                };
            });
            setPerformance(perf);
        };

        if (pumpId) fetchPumpAndSales();
    }, [pumpId, router]);

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/fuel-pumps/${pumpId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Fuel pump deleted successfully");
                router.push("/admin/FuelPumps");
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Failed to delete fuel pump");
            }
        } catch (error) {
            console.error("Error deleting fuel pump:", error);
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

    if (!data) {
        return <div className="p-6 text-center">Pump not found</div>;
    }

    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/admin/FuelPumps")}
                        className="rounded-md"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-xl font-semibold text-[#020617]">Fuel Pump Details</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="gap-2 rounded-md bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this fuel pump from the database.
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
                        onClick={() => router.push(`/admin/FuelPumps/${data.id}/edit`)}
                        className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md w-full sm:w-auto"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                </div>
            </div>

            {/* Details Card */}
            <Card className="p-6 bg-white rounded-xl border shadow-sm space-y-6">
                {/* Section 1: Basic Information */}
                <div>
                    <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-4 border-b pb-2">
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs uppercase text-[#64748b] mb-1">Pump ID</p>
                            <p className="text-base font-semibold text-[#020617]">{data.id.slice(-6).toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-[#64748b] mb-1">Pump Name</p>
                            <p className="text-base font-semibold text-[#020617]">{data.name}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-[#64748b] mb-1">Location</p>
                            <p className="text-base font-semibold text-[#020617]">{data.location}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-[#64748b] mb-1">Status</p>
                            <Badge
                                className={
                                    data.status === "Active"
                                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                                        : "bg-red-100 text-red-600 hover:bg-red-100"
                                }
                            >
                                {data.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Section 2: Operational Data */}
                <div>
                    <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-4 border-b pb-2">
                        Operational Data
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs uppercase text-[#64748b] mb-1">Total Nozzles</p>
                            <p className="text-base font-semibold text-[#020617]">{data.totalNozzles}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-[#64748b] mb-2">Fuel Types Available</p>
                            <div className="flex flex-wrap gap-2">
                                {data.fuelTypes.length > 0 ? data.fuelTypes.map((fuel) => (
                                    <Badge
                                        key={fuel}
                                        className="bg-[#14b8a6]/10 text-[#14b8a6] hover:bg-[#14b8a6]/10"
                                    >
                                        {fuel}
                                    </Badge>
                                )) : "—"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2.5: Nozzle Performance Logs */}
                {performance.length > 0 && (
                    <div>
                        <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-4 border-b pb-2">
                            Nozzle Performance Logs (Liters)
                        </h2>
                        <div className="overflow-x-auto border rounded-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-[#020617]">Nozzle</th>
                                        <th className="px-4 py-3 font-semibold text-[#020617]">Fuel Type</th>
                                        <th className="px-4 py-3 font-semibold text-[#020617]">Till Yesterday</th>
                                        <th className="px-4 py-3 font-semibold text-[#020617]">Today&apos;s Sale</th>
                                        <th className="px-4 py-3 font-semibold text-[#020617]">Total Sale</th>
                                        <th className="px-4 py-3 font-semibold text-[#020617]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {performance.map((perf, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-[#020617]">{perf.name}</td>
                                            <td className="px-4 py-3 text-[#64748b]">{perf.fuelType}</td>
                                            <td className="px-4 py-3 text-[#020617] font-medium">{perf.tillYesterday.toLocaleString()} L</td>
                                            <td className="px-4 py-3 text-[#14b8a6] font-semibold">{perf.todaySale.toLocaleString()} L</td>
                                            <td className="px-4 py-3 text-[#020617] font-bold bg-[#f8fafc]">{perf.total.toLocaleString()} L</td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/FuelPumps/${pumpId}/nozzles/${perf.id}`)}
                                                >
                                                    View Credits
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section 3: Notes */}
                <div>
                    <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-4 border-b pb-2">
                        Notes
                    </h2>
                    <p className="text-base text-[#020617]">
                        {data.notes || "—"}
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default FuelPumpView;
