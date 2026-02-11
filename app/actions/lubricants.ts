"use server";

import connectDB from "@/lib/db";
import Stock from "@/models/Stock";
import Sale, { ISale, ISaleItem, IPaymentHistoryEntry } from "@/models/Sale";
import Customer from "@/models/Customer";
import FuelPump from "@/models/FuelPump";
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

export async function getLubricantVariations(category: string, subCategory: 'Petrol' | 'Diesel') {
    await connectDB();

    // Fetch all stock entries that match the lubricant category and subcategory
    // We need to group them by lubeName and unitVolume to show current totals
    const stocks = await Stock.find({
        fuelType: category,
        lubeCategory: subCategory,
    }).sort({ purchaseDate: 1 });

    // Group by variation: Name + Volume
    const variations: Record<string, {
        lubeName: string;
        unitVolume: number;
        totalUnits: number;
        salePricePerUnit: number;
    }> = {};

    stocks.forEach(stock => {
        const key = `${stock.lubeName}-${stock.unitVolume}`;
        if (!variations[key]) {
            variations[key] = {
                lubeName: stock.lubeName || "Unknown",
                unitVolume: stock.unitVolume || 0,
                totalUnits: stock.unitsQuantity || 0,
                salePricePerUnit: (stock.salePricePerLiter || 0) * (stock.unitVolume || 0)
            };
        } else {
            variations[key].totalUnits += (stock.unitsQuantity || 0);
            // We use the latest sale price set in stock
            variations[key].salePricePerUnit = (stock.salePricePerLiter || 0) * (stock.unitVolume || 0);
        }
    });

    return Object.values(variations);
}

interface LubeSaleItem {
    lubeName: string;
    unitVolume: number;
    quantityUnits: number;
    pricePerUnit: number;
}

interface CreditSale {
    name: string;
    phone: string;
    amount: number;
}

export async function submitLubricantBulkSale(
    pumpId: string,
    employerId: string,
    category: string,
    subCategory: string,
    sales: LubeSaleItem[],
    creditSales: CreditSale[]
) {
    await connectDB();

    const pump = await findPump(pumpId);
    if (!pump) throw new Error("Pump not found");

    const saleItems: ISaleItem[] = [];
    let grandTotal = 0;

    for (const item of sales) {
        if (item.quantityUnits <= 0) continue;

        const totalAmount = item.quantityUnits * item.pricePerUnit;
        const totalLiters = item.quantityUnits * item.unitVolume;

        // Stock Deduction Logic (FIFO)
        let remainingUnitsToDeduct = item.quantityUnits;
        let itemPurchaseCost = 0;

        const stocks = await Stock.find({
            fuelType: category,
            lubeCategory: subCategory,
            lubeName: item.lubeName,
            unitVolume: item.unitVolume,
            unitsQuantity: { $gt: 0 }
        }).sort({ purchaseDate: 1 });

        for (const stock of stocks) {
            if (remainingUnitsToDeduct <= 0) break;

            const deduct = Math.min(stock.unitsQuantity || 0, remainingUnitsToDeduct);
            const unitCost = (stock.purchasePricePerLiter || 0) * (stock.unitVolume || 0);
            itemPurchaseCost += (deduct * unitCost);

            stock.unitsQuantity = (stock.unitsQuantity || 0) - deduct;
            stock.quantity = (stock.quantity || 0) - (deduct * (stock.unitVolume || 0));
            remainingUnitsToDeduct -= deduct;
            await stock.save();
        }

        const avgPurchaseRatePerUnit = itemPurchaseCost / item.quantityUnits;

        saleItems.push({
            productName: `${item.lubeName} (${item.unitVolume}L)`,
            category: "Lubricants",
            quantity: item.quantityUnits,
            unit: "pcs",
            quantityInLiters: totalLiters,
            rate: item.pricePerUnit,
            total: totalAmount,
            purchaseRate: avgPurchaseRatePerUnit,
            purchaseTotal: itemPurchaseCost
        });

        grandTotal += totalAmount;
    }

    if (saleItems.length === 0) throw new Error("No items selected for sale");

    // Process Credit Sales
    const creditTotal = creditSales.reduce((sum, c) => sum + c.amount, 0);
    const cashAmount = grandTotal - creditTotal;

    const creditCustomers = [];
    for (const credit of creditSales) {
        let customer = await Customer.findOne({ phone: credit.phone });
        if (!customer) {
            customer = await Customer.create({
                name: credit.name,
                phone: credit.phone,
                balance: 0
            });
        }
        customer.balance += credit.amount;
        await customer.save();

        creditCustomers.push({
            customerId: customer._id,
            name: credit.name,
            phone: credit.phone,
            amount: credit.amount
        });
    }

    // Create Sale Record
    const saleData: Partial<ISale> = {
        employerId: mongoose.Types.ObjectId.isValid(employerId) ? new mongoose.Types.ObjectId(employerId) : (employerId as unknown as mongoose.Types.ObjectId),
        pumpId: pump._id,
        items: saleItems,
        subtotal: grandTotal,
        tax: 0,
        grandTotal: grandTotal,
        amountPaid: cashAmount,
        changeReturned: 0,
        paymentStatus: (creditTotal > 0 ? "Partial" : "Paid") as "Paid" | "Partial" | "Overpaid",
        paymentMethod: "Cash",
        status: "Approved",
        notes: `Lubricant Bulk Sale (${subCategory})`,
        creditCustomers: creditCustomers.map(c => ({ customerId: c.customerId, amount: c.amount })),
        paymentHistory: [{
            action: "Initial Sale",
            amount: cashAmount,
            paymentMethod: "Cash",
            performedBy: "Employer",
            timestamp: new Date()
        }] as IPaymentHistoryEntry[]
    };

    if (creditCustomers.length === 1) {
        saleData.customerId = creditCustomers[0].customerId;
    }

    await Sale.create(saleData);

    revalidatePath(`/employer/${pumpId}/nozzles`);
    return { success: true, message: "Lubricant sale recorded successfully" };
}
