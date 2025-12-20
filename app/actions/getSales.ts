"use server";

import connectDB from "@/lib/db";
import Sale from "@/models/Sale";

export async function getSalesByEmployer(employerId: string) {
    try {
        await connectDB();

        const sales = await Sale.find({ employerId })
            .sort({ createdAt: -1 })
            .populate("employerId", "fullName email")
            .populate("pumpId", "pumpName location")
            .lean();

        // Convert to plain objects and stringify dates
        return JSON.parse(JSON.stringify(sales));
    } catch (error) {
        console.error("Error fetching sales:", error);
        return [];
    }
}

export async function getSaleById(saleId: string) {
    try {
        await connectDB();

        const sale = await Sale.findById(saleId)
            .populate("employerId", "fullName email")
            .populate("pumpId", "pumpName location")
            .lean();

        if (!sale) return null;

        // Convert to plain object and stringify dates
        return JSON.parse(JSON.stringify(sale));
    } catch (error) {
        console.error("Error fetching sale:", error);
        return null;
    }
}
