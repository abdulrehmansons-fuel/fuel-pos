"use client";

import { useState, useEffect } from "react";
import { submitDailySale, getFuelPrices } from "@/app/actions/nozzles";
import { toast } from "sonner"; // Assuming sonner or similar toast


interface Nozzle {
    _id: string;
    name: string;
    fuelType: string;
    openingReading: number;
}

interface AddBulkSalesProps {
    pumpId: string;
    employerId: string; // Passed from parent
    nozzles: Nozzle[];
}

export default function AddBulkSales({ pumpId, employerId, nozzles }: AddBulkSalesProps) {
    const [selectedNozzleId, setSelectedNozzleId] = useState("");
    const [closingReading, setClosingReading] = useState<number | "">("");
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [creditSales, setCreditSales] = useState<{ name: string; phone: string; amount: number }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getFuelPrices().then(setPrices);
    }, []);

    const selectedNozzle = nozzles.find(n => n._id === selectedNozzleId);

    // Calculate sold quantity from closing reading - previous reading
    const previousReading = selectedNozzle ? selectedNozzle.openingReading : 0;
    const soldQuantity = typeof closingReading === "number" ? closingReading - previousReading : 0;
    const price = selectedNozzle ? prices[selectedNozzle.fuelType] || 0 : 0;
    const totalAmount = soldQuantity * price;

    // Credit Sales Handling
    const [newCredit, setNewCredit] = useState({ name: "", phone: "", amount: "" });

    const addCreditSale = () => {
        if (!newCredit.name || !newCredit.phone || !newCredit.amount) return;
        setCreditSales([...creditSales, { ...newCredit, amount: Number(newCredit.amount) }]);
        setNewCredit({ name: "", phone: "", amount: "" });
    };

    const removeCreditSale = (index: number) => {
        const newCredits = [...creditSales];
        newCredits.splice(index, 1);
        setCreditSales(newCredits);
    };

    const totalCredits = creditSales.reduce((sum, item) => sum + item.amount, 0);
    const balanceRemaining = totalAmount - totalCredits;

    const handleSubmit = async () => {
        if (!selectedNozzleId || typeof closingReading !== "number") {
            toast.error("Please select nozzle and enter closing reading");
            return;
        }

        if (closingReading <= previousReading) {
            toast.error("Closing reading must be greater than previous reading");
            return;
        }

        setLoading(true);
        try {
            await submitDailySale(pumpId, employerId, selectedNozzleId, closingReading, creditSales);

            // Reset form
            setSelectedNozzleId("");
            setClosingReading("");
            setCreditSales([]);
            toast.success("Daily Sale Recorded Successfully!");
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to record sale");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-6 text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-fuel text-teal-600"><line x1="3" x2="15" y1="22" y2="22" /><line x1="4" x2="14" y1="9" y2="9" /><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" /><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" /></svg>
                Add Daily Nozzle Sale
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Nozzle</label>
                    <div className="relative">
                        <select
                            className="block w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                            value={selectedNozzleId}
                            onChange={(e) => setSelectedNozzleId(e.target.value)}
                        >
                            <option value="">-- Select Nozzle --</option>
                            {nozzles.map(n => (
                                <option key={n._id} value={n._id}>{n.name} - {n.fuelType}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedNozzle && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1 uppercase tracking-wide font-semibold">Previous Reading</p>
                        <p className="text-2xl font-mono font-bold text-slate-800">{selectedNozzle.openingReading.toLocaleString()}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Closing Reading</label>
                    <input
                        type="number"
                        placeholder="e.g. 1000"
                        className="block w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        value={closingReading}
                        onChange={(e) => setClosingReading(e.target.value === "" ? "" : Number(e.target.value))}
                        disabled={!selectedNozzleId}
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="16" y2="12" /><line x1="12" x2="12.01" y1="8" y2="8" /></svg>
                        Enter Closing meter reading.
                    </p>
                </div>

                <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                    <div className="flex justify-between flex-col gap-3">
                        <div>
                            <p className="text-sm text-teal-700 font-medium">Fuel Sold (Calculated)</p>
                            <p className="text-2xl font-bold text-teal-900">
                                {selectedNozzle && typeof closingReading === "number"
                                    ? soldQuantity.toLocaleString() + " L"
                                    : "—"}
                            </p>
                        </div>
                        <div className="border-t border-teal-200 pt-3 flex justify-between items-end">
                            <div>
                                <p className="text-sm text-teal-700 font-medium">Total Amount</p>
                                <p className="text-xs text-teal-600">Rate: Rs. {price}</p>
                            </div>
                            <p className="text-2xl font-bold text-teal-900">Rs. {
                                totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            }</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Credit Sales Section */}
            <div className="border-t border-slate-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Remaining Balances (Credit Sales)</h3>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                            placeholder="Customer Name"
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500"
                            value={newCredit.name}
                            onChange={e => setNewCredit({ ...newCredit, name: e.target.value })}
                        />
                        <input
                            placeholder="Phone (03...)"
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500"
                            value={newCredit.phone}
                            onChange={e => setNewCredit({ ...newCredit, phone: e.target.value })}
                        />
                        <input
                            placeholder="Amount"
                            type="number"
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500"
                            value={newCredit.amount}
                            onChange={e => setNewCredit({ ...newCredit, amount: e.target.value })}
                        />
                        <button
                            onClick={addCreditSale}
                            className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <span>Add Credit</span>
                        </button>
                    </div>
                </div>

                {creditSales.length > 0 && (
                    <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="p-3 text-left font-medium text-slate-700">Name</th>
                                    <th className="p-3 text-left font-medium text-slate-700">Phone</th>
                                    <th className="p-3 text-right font-medium text-slate-700">Amount</th>
                                    <th className="p-3 text-center font-medium text-slate-700">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {creditSales.map((c, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="p-3 text-slate-800">{c.name}</td>
                                        <td className="p-3 text-slate-600">{c.phone}</td>
                                        <td className="p-3 text-right font-medium text-slate-800">Rs. {c.amount.toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => removeCreditSale(i)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                                <tr>
                                    <td colSpan={2} className="p-3 text-right text-slate-600">Total Credits:</td>
                                    <td className="p-3 text-right text-slate-800">Rs. {totalCredits.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
                    <span className="text-green-800 font-medium">Net Cash in Hand</span>
                    <span className="text-2xl font-bold text-green-700">Rs. {balanceRemaining.toLocaleString()}</span>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading || !selectedNozzleId}
                className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-md transition-all ${loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 hover:shadow-lg active:transform active:scale-[0.99]"
                    }`}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Sale...
                    </span>
                ) : "Submit Daily Sale"}
            </button>
        </div>
    );
}
