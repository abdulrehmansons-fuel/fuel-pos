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
    const [selectedCategory, setSelectedCategory] = useState("");
    const [closingReadings, setClosingReadings] = useState<Record<string, number | "">>({});
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [creditSales, setCreditSales] = useState<{ nozzleId: string; name: string; phone: string; amount: number }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getFuelPrices().then(setPrices);
    }, []);

    const filteredNozzles = nozzles.filter(n => n.fuelType === selectedCategory);

    // Calculate totals for all nozzles in the selected category
    const nozzleCalculations = filteredNozzles.map(nozzle => {
        const closingReading = closingReadings[nozzle._id] || "";
        const previousReading = nozzle.openingReading;
        const soldQuantity = typeof closingReading === "number" ? closingReading - previousReading : 0;
        const price = prices[nozzle.fuelType] || 0;
        const totalAmount = soldQuantity * price;
        return {
            ...nozzle,
            soldQuantity,
            price,
            totalAmount,
            isValid: typeof closingReading === "number" && closingReading > previousReading
        };
    });

    const grandTotalAmount = nozzleCalculations.reduce((sum, n) => sum + n.totalAmount, 0);
    const totalSoldQuantity = nozzleCalculations.reduce((sum, n) => sum + n.soldQuantity, 0);

    // Credit Sales Handling
    const [newCredit, setNewCredit] = useState({ nozzleId: "", name: "", phone: "", amount: "" });

    const addCreditSale = () => {
        if (!newCredit.nozzleId || !newCredit.name || !newCredit.phone || !newCredit.amount) {
            toast.error("Please fill all credit fields including nozzle selection");
            return;
        }
        setCreditSales([...creditSales, { ...newCredit, amount: Number(newCredit.amount) }]);
        setNewCredit({ ...newCredit, name: "", phone: "", amount: "" });
    };

    const removeCreditSale = (index: number) => {
        const newCredits = [...creditSales];
        newCredits.splice(index, 1);
        setCreditSales(newCredits);
    };

    const totalCredits = creditSales.reduce((sum, item) => sum + item.amount, 0);
    const balanceRemaining = grandTotalAmount - totalCredits;

    const handleSubmit = async () => {
        const nozzlesToSubmit = nozzleCalculations.filter(n => n.isValid);

        if (nozzlesToSubmit.length === 0) {
            toast.error("Please enter valid closing readings for at least one nozzle");
            return;
        }

        setLoading(true);
        let successCount = 0;
        try {
            for (const n of nozzlesToSubmit) {
                const nozzleCredits = creditSales
                    .filter(c => c.nozzleId === n._id)
                    .map(({ name, phone, amount }) => ({ name, phone, amount }));

                await submitDailySale(
                    pumpId,
                    employerId,
                    n._id,
                    Number(closingReadings[n._id]),
                    nozzleCredits
                );
                successCount++;
            }

            // Reset form
            setSelectedCategory("");
            setClosingReadings({});
            setCreditSales([]);
            toast.success(`Daily Sales Recorded Successfully for ${successCount} nozzles!`);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to record sales");
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

            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2 font-semibold">Select Main Category</label>
                <div className="flex flex-wrap gap-2">
                    {["Petrol", "Diesel", "High-Octane", "Engine Oil", "Lubricants"].map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setSelectedCategory(cat);
                                setClosingReadings({});
                                setCreditSales([]);
                            }}
                            className={`px-4 py-2 rounded-full border transition-all text-sm font-medium ${selectedCategory === cat
                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:border-teal-500 hover:text-teal-600"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {selectedCategory ? (
                <div className="mb-8">
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-700 text-sm">Nozzle</th>
                                    <th className="p-4 font-semibold text-slate-700 text-sm">Previous Reading</th>
                                    <th className="p-4 font-semibold text-slate-700 text-sm">Closing Reading</th>
                                    <th className="p-4 font-semibold text-slate-700 text-sm">Sold (L)</th>
                                    <th className="p-4 font-semibold text-slate-700 text-sm">Sale Price</th>
                                    <th className="p-4 font-semibold text-slate-700 text-sm text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {nozzleCalculations.map((n) => (
                                    <tr key={n._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-bold text-slate-800">{n.name}</span>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{n.fuelType}</div>
                                        </td>
                                        <td className="p-4 text-slate-600 font-mono">
                                            {n.openingReading.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                className={`w-32 p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all ${closingReadings[n._id] && !n.isValid ? "border-red-300 bg-red-50" : "border-slate-200"
                                                    }`}
                                                placeholder="Enter reading"
                                                value={closingReadings[n._id]}
                                                onChange={(e) => setClosingReadings({
                                                    ...closingReadings,
                                                    [n._id]: e.target.value === "" ? "" : Number(e.target.value)
                                                })}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <span className={`font-semibold ${n.soldQuantity > 0 ? "text-teal-600" : "text-slate-300"}`}>
                                                {n.soldQuantity > 0 ? `${n.soldQuantity.toLocaleString()} L` : "—"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-600 font-medium">Rs. {n.price.toFixed(2)}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`font-bold ${n.totalAmount > 0 ? "text-slate-900" : "text-slate-300"}`}>
                                                {n.totalAmount > 0 ? `Rs. ${n.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-teal-50/50 border-t border-teal-100">
                                <tr className="font-bold text-teal-900">
                                    <td colSpan={3} className="p-4 text-right uppercase text-xs tracking-wider">Grand Total</td>
                                    <td className="p-4">{totalSoldQuantity.toLocaleString()} L</td>
                                    <td className="p-4 text-right text-lg">
                                        Rs. {grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center mb-8">
                    <div className="flex justify-center mb-3">
                        <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <p className="text-slate-500 font-medium">Please select a main category to load nozzles</p>
                </div>
            )}

            {/* Credit Sales Section */}
            <div className="border-t border-slate-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Remaining Balances (Credit Sales)</h3>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <select
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 bg-white"
                            value={newCredit.nozzleId}
                            onChange={e => setNewCredit({ ...newCredit, nozzleId: e.target.value })}
                            disabled={!selectedCategory}
                        >
                            <option value="">Select Nozzle</option>
                            {filteredNozzles.map(n => (
                                <option key={n._id} value={n._id}>{n.name}</option>
                            ))}
                        </select>
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
                                    <th className="p-3 text-left font-medium text-slate-700">Nozzle</th>
                                    <th className="p-3 text-left font-medium text-slate-700">Name</th>
                                    <th className="p-3 text-left font-medium text-slate-700">Phone</th>
                                    <th className="p-3 text-right font-medium text-slate-700">Amount</th>
                                    <th className="p-3 text-center font-medium text-slate-700">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {creditSales.map((c, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="p-3 text-slate-600 font-medium">
                                            {nozzles.find(n => n._id === c.nozzleId)?.name}
                                        </td>
                                        <td className="p-3 text-slate-800">{c.name}</td>
                                        <td className="p-3 text-slate-600">{c.phone}</td>
                                        <td className="p-3 text-right font-medium text-slate-800">Rs. {c.amount.toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => removeCreditSale(i)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                                <tr>
                                    <td colSpan={3} className="p-3 text-right text-slate-600">Total Credits:</td>
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
                disabled={loading || !selectedCategory || nozzleCalculations.filter(n => n.isValid).length === 0}
                className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-md transition-all ${loading || !selectedCategory || nozzleCalculations.filter(n => n.isValid).length === 0
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
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
