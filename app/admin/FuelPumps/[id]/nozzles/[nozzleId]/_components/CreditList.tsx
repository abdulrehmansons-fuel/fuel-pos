"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";
import { setCustomerBalance } from "@/app/actions/customers"; // We need this action accessible
import { toast } from "sonner";

// Since we are client-side fetching for now or server fetching?
// Best to be Server Component for data? 
// But "Edit" requires client interaction.
// Let's make the main page a Server Component and the Table a Client Component.

interface Customer {
    _id: string;
    name: string;
    phone: string;
    balance: number;
}

interface CreditPageProps {
    pumpId: string;
    nozzleId: string;
    customers: Customer[];
    nozzleName: string;
}

export default function NozzleCreditsList({ pumpId, nozzleId, customers, nozzleName }: CreditPageProps) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const startEdit = (c: Customer) => {
        setEditingId(c._id);
        setEditValue(c.balance.toString());
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue("");
    };

    const saveEdit = async (customerId: string) => {
        const newVal = Number(editValue);
        if (isNaN(newVal)) return toast.error("Invalid number");

        setLoading(true);
        try {
            await setCustomerBalance(customerId, newVal);
            toast.success("Balance updated");
            setEditingId(null);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="outline" onClick={() => router.back()} className="rounded-md">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <h1 className="text-xl font-semibold text-[#020617]">Credits: {decodeURIComponent(nozzleName)}</h1>
            </div>

            <div className="bg-white rounded-xl shadow border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-600">Customer Name</th>
                            <th className="p-4 font-medium text-gray-600">Phone</th>
                            <th className="p-4 font-medium text-gray-600">Current Balance</th>
                            <th className="p-4 font-medium text-gray-600 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {customers.map((c) => (
                            <tr key={c._id} className="hover:bg-gray-50">
                                <td className="p-4">{c.name}</td>
                                <td className="p-4">{c.phone}</td>
                                <td className="p-4">
                                    {editingId === c._id ? (
                                        <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            type="number"
                                            className="w-32"
                                        />
                                    ) : (
                                        <span className={`font-bold ${c.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                                            Rs. {c.balance.toLocaleString()}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {editingId === c._id ? (
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={loading}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" className="bg-green-600 text-white" onClick={() => saveEdit(c._id)} disabled={loading}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                                            <Edit2 className="w-4 h-4 mr-2" /> Edit Balance
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-6 text-center text-gray-500">
                                    No credit customers found associated with this nozzle.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
