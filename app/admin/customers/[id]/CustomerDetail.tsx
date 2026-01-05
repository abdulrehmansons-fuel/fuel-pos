"use client";

import { useState } from "react";
import { updateCustomerBalance } from "@/app/actions/customers";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
    customer: any;
}

export default function CustomerView({ customer }: PageProps) {
    const router = useRouter();
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (!amount || Number(amount) <= 0) return alert("Enter valid amount");
        if (!confirm(`Register payment of Rs. ${amount}?`)) return;

        setLoading(true);
        try {
            await updateCustomerBalance(customer._id, Number(amount));
            alert("Payment recorded!");
            router.refresh(); // Refresh server data
            setAmount("");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <h1 className="text-2xl font-bold">Customer Details</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Details Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Profile</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Name</span>
                            <span className="font-bold">{customer.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Phone</span>
                            <span className="font-bold">{customer.phone}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Current Balance</span>
                            <span className={`font-bold text-xl ${customer.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                                Rs. {customer.balance.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Receive Payment</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Payment Amount (Rs)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md"
                                placeholder="Enter amount received"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={handlePayment}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Update Balance"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
