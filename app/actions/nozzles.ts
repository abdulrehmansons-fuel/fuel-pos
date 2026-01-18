"use server";

import connectDB from "@/lib/db";
import FuelPump from "@/models/FuelPump";
import Sale, { ISale, ISaleItem, IPaymentHistoryEntry } from "@/models/Sale";
import Stock from "@/models/Stock";
import Customer from "@/models/Customer";
import { revalidatePath } from "next/cache";


import mongoose from "mongoose";

async function findPump(pumpId: string) {
    if (mongoose.Types.ObjectId.isValid(pumpId)) {
        const pump = await FuelPump.findById(pumpId);
        if (pump) return pump;
    }
    const decodedName = decodeURIComponent(pumpId);
    return await FuelPump.findOne({ pumpName: decodedName });
}

export async function getNozzles(pumpId: string) {
    await connectDB();
    const pump = await findPump(pumpId);
    if (!pump) throw new Error("Pump not found");
    return JSON.parse(JSON.stringify(pump.nozzles));
}

export async function getFuelPrices() {
    await connectDB();
    // Get latest stock for each fuel type to find price
    // Aggregate to find latest price per fuelType?
    // Or just find distinct fuelTypes and query?
    // We'll just fetch all stocks and reduce? Or find one per type.
    const fuels = ["Petrol", "Diesel", "Hi-Octane"]; // Common types
    const prices: Record<string, number> = {};

    for (const fuel of fuels) {
        const stock = await Stock.findOne({ fuelType: fuel }).sort({ createdAt: -1 });
        if (stock) {
            prices[fuel] = stock.salePricePerLiter;
        } else {
            prices[fuel] = 0;
        }
    }
    return prices;
}

export async function addNozzle(pumpId: string, data: { name: string; fuelType: string; openingReading: number }) {
    await connectDB();
    const pump = await findPump(pumpId);
    if (!pump) throw new Error("Pump not found");

    pump.nozzles.push(data);
    await pump.save();
    // Revalidate both ID and Name paths to be safe, or just the current path logic which is generic?
    // revalidatePath only works if we know the exact path string users are on.
    // Employer path: /employer/[pumpName]/...
    // We can't easily guess the pumpName if we only used ID.
    // But here pumpId IS the param passed from the UI (which might be name).
    revalidatePath(`/employer/${pumpId}/nozzles`);
    return { success: true, message: "Nozzle added successfully" };
}

export async function updateNozzle(pumpId: string, nozzleId: string, data: { name: string; fuelType: string; openingReading: number }) {
    await connectDB();
    const pump = await findPump(pumpId);
    if (!pump) throw new Error("Pump not found");

    const nozzle = pump.nozzles.id(nozzleId);
    if (!nozzle) throw new Error("Nozzle not found");

    nozzle.name = data.name;
    nozzle.fuelType = data.fuelType;
    nozzle.openingReading = data.openingReading;

    await pump.save();
    revalidatePath(`/employer/${pumpId}/nozzles`);
    return { success: true, message: "Nozzle updated successfully" };
}

export async function deleteNozzle(pumpId: string, nozzleId: string) {
    await connectDB();
    const pump = await findPump(pumpId);
    if (!pump) throw new Error("Pump not found");

    pump.nozzles.pull({ _id: nozzleId });
    await pump.save();
    revalidatePath(`/employer/${pumpId}/nozzles`);
    return { success: true, message: "Nozzle deleted successfully" };
}

interface CreditSale {
    name: string;
    phone: string;
    amount: number;
}

export async function submitDailySale(
    pumpId: string,
    employerId: string,
    nozzleId: string,
    closingReading: number,
    creditSales: CreditSale[]
) {
    await connectDB();
    const pump = await findPump(pumpId);
    if (!pump) throw new Error("Pump not found");

    const nozzle = pump.nozzles.id(nozzleId);
    if (!nozzle) throw new Error("Nozzle not found");

    const openingReading = nozzle.openingReading;

    // Calculate sold quantity from closing reading - opening reading
    const soldQuantity = closingReading - openingReading;

    if (soldQuantity <= 0) {
        throw new Error("Closing reading must be greater than opening reading");
    }

    // Get Stock Price for this Fuel Type
    // We assume the latest stock entry determines the price, or we should have a Price configuration.
    // The Stock model has salePricePerLiter.
    const latestStock = await Stock.findOne({ fuelType: nozzle.fuelType })
        .sort({ createdAt: -1 });

    // Fallback price or throw error?
    const rate = latestStock ? latestStock.salePricePerLiter : 0;
    if (rate === 0) throw new Error(`Price not found for ${nozzle.fuelType}`);

    const totalAmount = soldQuantity * rate;

    // Calculate details
    const creditTotal = creditSales.reduce((sum, item) => sum + item.amount, 0);
    const cashAmount = totalAmount - creditTotal;

    if (cashAmount < 0) {

    }


    // 1. Stock Deduction with Cost Calculation
    let remainingToDeduct = soldQuantity;
    let totalCost = 0; // Track total purchase cost of sold fuel

    const stocks = await Stock.find({ fuelType: nozzle.fuelType, quantity: { $gt: 0 } })
        .sort({ purchaseDate: 1 }); // FIFO

    for (const stock of stocks) {
        if (remainingToDeduct <= 0) break;

        const deduct = Math.min(stock.quantity, remainingToDeduct);
        const stockCost = Number(stock.purchasePricePerLiter) || 0;
        totalCost += (deduct * stockCost);

        stock.quantity -= deduct;
        remainingToDeduct -= deduct;
        await stock.save();
    }

    // Calculate Average Cost Rate for this sale
    const averagePurchaseRate = totalCost / soldQuantity;

    // 2. Process Credit Sales - Update Customer Balances
    const creditCustomers = [];
    for (const credit of creditSales) {
        // Find or Create Customer
        let customer = await Customer.findOne({ phone: credit.phone });
        if (!customer) {
            customer = await Customer.create({
                name: credit.name,
                phone: credit.phone,
                balance: 0
            });
        }

        // Update Balance
        customer.balance += credit.amount;
        await customer.save();

        // Track customer for sale record
        creditCustomers.push({
            customerId: customer._id,
            name: credit.name,
            phone: credit.phone,
            amount: credit.amount
        });
    }

    // 3. Create ONE Sale Record for the Entire Bulk Sale
    const saleData: Partial<ISale> = {
        employerId: new mongoose.Types.ObjectId(employerId),
        pumpId: pump._id,
        items: [{
            productName: nozzle.fuelType,
            category: "Fuel",
            quantity: soldQuantity,
            unit: "L",
            quantityInLiters: soldQuantity,
            rate: rate,
            total: totalAmount,
            purchaseRate: averagePurchaseRate,
            purchaseTotal: soldQuantity * averagePurchaseRate,
            nozzleId: nozzleId
        }] as ISaleItem[],
        subtotal: totalAmount,
        tax: 0,
        grandTotal: totalAmount,
        amountPaid: cashAmount, // Cash received
        changeReturned: 0,
        paymentStatus: (creditTotal > 0 ? "Partial" : "Paid") as "Paid" | "Partial" | "Overpaid",
        paymentMethod: "Cash",
        status: "Approved",
        paymentHistory: [{
            action: "Initial Sale",
            amount: cashAmount,
            paymentMethod: "Cash",
            performedBy: "Employer",
            timestamp: new Date()
        }] as IPaymentHistoryEntry[]
    };

    // Add notes about credit customers if any
    if (creditCustomers.length > 0) {
        const creditNotes = creditCustomers.map(c => `${c.name} (${c.phone}): Rs. ${c.amount}`).join(", ");
        saleData.notes = `Bulk Sale - Credits: ${creditNotes}`;

        // Populate creditCustomers array for proper tracking
        saleData.creditCustomers = creditCustomers.map(c => ({
            customerId: c.customerId,
            amount: c.amount
        }));

        // Link the first customer if there's only one, or create a note for multiple
        if (creditCustomers.length === 1) {
            saleData.customerId = creditCustomers[0].customerId;
        }
    } else {
        saleData.notes = "Daily Nozzle Bulk Sale - Full Cash Payment";
    }

    await Sale.create(saleData);


    // 4. Update Nozzle
    nozzle.openingReading = closingReading;
    await pump.save();

    revalidatePath(`/employer/${pumpId}/nozzles`);
    return { success: true, message: "Daily sale recorded successfully" };
}
