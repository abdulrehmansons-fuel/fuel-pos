"use server";

import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import Customer from "@/models/Customer";


interface CustomerData {
    _id: string;
    name: string;
    phone: string;
    balance: number;
}

export async function getNozzleCreditCustomers(pumpId: string, nozzleId: string): Promise<CustomerData[]> {
    await connectDB();

    // Find all sales for this nozzle that have credit customers
    const sales = await Sale.find({
        pumpId: pumpId,
        "items.nozzleId": nozzleId,
        $or: [
            { customerId: { $exists: true } }, // Old single customer format
            { creditCustomers: { $exists: true, $ne: [] } } // New multiple customers format
        ]
    }).select("customerId creditCustomers");

    // Collect unique customer IDs from both formats
    const customerIds = new Set<string>();

    for (const sale of sales) {
        // Handle old format (single customerId)
        if (sale.customerId) {
            customerIds.add(sale.customerId.toString());
        }

        // Handle new format (creditCustomers array)
        if (sale.creditCustomers && Array.isArray(sale.creditCustomers)) {
            for (const credit of sale.creditCustomers) {
                if (credit.customerId) {
                    customerIds.add(credit.customerId.toString());
                }
            }
        }
    }

    if (customerIds.size === 0) return [];

    const customers = await Customer.find({
        _id: { $in: Array.from(customerIds) },
        balance: { $ne: 0 }
    }).lean();

    return JSON.parse(JSON.stringify(customers));
}
