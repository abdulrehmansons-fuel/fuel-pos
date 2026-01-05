"use server";

import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import Customer from "@/models/Customer";
import mongoose from "mongoose";

interface CustomerData {
    _id: string;
    name: string;
    phone: string;
    balance: number;
}

export async function getNozzleCreditCustomers(pumpId: string, nozzleId: string): Promise<CustomerData[]> {
    await connectDB();

    // 1. Find all "Partial" sales for this nozzle
    // Note: nozzleId in Sale Items is a string.
    // We need to match where items.nozzleId == nozzleId OR items matches nozzle name?
    // In submitDailySale, we saved `nozzleId` (which is the _id from pump.nozzles).

    // We want unique Customers.
    const sales = await Sale.find({
        pumpId: pumpId,
        "items.nozzleId": nozzleId,
        customerId: { $exists: true } // Only linked sales
    }).select("customerId");

    const customerIds = [...new Set(sales.map(s => s.customerId.toString()))];

    if (customerIds.length === 0) return [];

    const customers = await Customer.find({ _id: { $in: customerIds } }).lean();

    return JSON.parse(JSON.stringify(customers));
}
