import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import Customer from "@/models/Customer";
import FuelPump from "@/models/FuelPump";

export async function GET() {
    try {
        await connectDB();

        // Find sales that have a partial payment status OR have credit customers
        const sales = await Sale.find({
            $or: [
                { paymentStatus: "Partial" },
                { "creditCustomers.0": { $exists: true } },
                { customerId: { $exists: true } }
            ]
        })
            .sort({ createdAt: -1 })
            .lean() as unknown as Record<string, unknown>[];
        // Extract related IDs
        const pumpIds = [...new Set(sales.map(s => s.pumpId?.toString()).filter(Boolean))];
        const customerIdsArr: string[] = [];
        sales.forEach(s => {
            if (s.customerId) customerIdsArr.push(s.customerId.toString());
            if (s.creditCustomers && Array.isArray(s.creditCustomers as [])) {
                (s.creditCustomers as Record<string, unknown>[]).forEach((cc) => {
                    if (cc.customerId) customerIdsArr.push(cc.customerId.toString());
                });
            }
        });
        const customerIds = [...new Set(customerIdsArr)];

        const [pumps, customers] = await Promise.all([
            FuelPump.find({ _id: { $in: pumpIds } }).select("pumpName location").lean() as unknown as Promise<Record<string, unknown>[]>,
            Customer.find({ _id: { $in: customerIds } }).select("name phone").lean() as unknown as Promise<Record<string, unknown>[]>,
        ]);

        const pumpMap = Object.fromEntries(pumps.map(p => [p._id.toString(), p.pumpName || p.location]));
        const customerMap = Object.fromEntries(customers.map(c => [c._id.toString(), { name: c.name, phone: c.phone }]));

        // Process and flatten credits
        const creditItems: Record<string, unknown>[] = [];

        sales.forEach(sale => {
            const scl = sale as Record<string, unknown>;
            const saleId = scl._id ? scl._id.toString().slice(-6).toUpperCase() : "N/A";
            const date = scl.createdAt || new Date();
            const pumpId = scl.pumpId?.toString() || "";
            const pumpName = pumpMap[pumpId] || "N/A";
            const totalSaleAmount = scl.grandTotal || 0;
            const status = scl.status || "Pending";

            // Check if it's a multiple credit customer sale
            if (scl.creditCustomers && Array.isArray(scl.creditCustomers as []) && (scl.creditCustomers as []).length > 0) {
                (scl.creditCustomers as Record<string, unknown>[]).forEach((cc) => {
                    const custId = cc.customerId?.toString();
                    const custInfo = custId && customerMap[custId] ? customerMap[custId] : { name: "Unknown", phone: "N/A" };
                    const creditAmt = Number(cc.amount);
                    if (creditAmt && creditAmt > 0) {
                        creditItems.push({
                            saleId,
                            date,
                            pumpId,
                            pump: pumpName,
                            customerName: custInfo.name,
                            customerPhone: custInfo.phone,
                            totalSaleAmount,
                            creditAmount: creditAmt,
                            status
                        });
                    }
                });
            } else if (Number(scl.amountPaid) < Number(scl.grandTotal)) {
                // Single customer with unpaid balance
                const custId = scl.customerId?.toString();
                const custInfo = custId && customerMap[custId] ? customerMap[custId] : { name: "Unknown", phone: "N/A" };
                const remainingBalance = Number(scl.grandTotal) - Number(scl.amountPaid);

                if (remainingBalance > 0) {
                    creditItems.push({
                        saleId,
                        date,
                        pumpId,
                        pump: pumpName,
                        customerName: custInfo.name,
                        customerPhone: custInfo.phone,
                        totalSaleAmount,
                        creditAmount: remainingBalance,
                        status
                    });
                }
            }
        });

        return NextResponse.json(creditItems, { status: 200 });
    } catch (error) {
        console.error("Error fetching credit reports:", error);
        return NextResponse.json(
            { error: "Failed to fetch credit reports" },
            { status: 500 }
        );
    }
}
