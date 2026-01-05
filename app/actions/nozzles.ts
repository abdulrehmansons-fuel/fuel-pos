"use server";

import connectDB from "@/lib/db";
import FuelPump from "@/models/FuelPump";
import Sale from "@/models/Sale";
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
    soldQuantity: number,
    creditSales: CreditSale[]
) {
    await connectDB();
    const pump = await findPump(pumpId);
    if (!pump) throw new Error("Pump not found");

    const nozzle = pump.nozzles.id(nozzleId);
    if (!nozzle) throw new Error("Nozzle not found");

    if (soldQuantity <= 0) {
        throw new Error("Sold quantity must be greater than zero");
    }

    const openingReading = nozzle.openingReading;
    const closingReading = openingReading + soldQuantity;
    // We no longer calculate soldQuantity from closingReading.
    // We calculate closingReading from soldQuantity.

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
        // This implies credits exceed total sales? Possible if they are paying off old debts?
        // But here we are recording *sales*.
        // If "Remaining Balances" means "Paying for today's fuel later", then Credit Total <= Total Amount.
        // Only if they are paying *extra*, but the prompt says "remaining balances of any users... paid like you can see checkout".
        // Actually "remaining balances" usually means what they *didn't* pay?
        // "enter customer name, phone num and how many amount he paid" -> Wait.
        // "add multiple data for remaining balances... amount he paid".
        // If he *paid*, that's cash in hand?
        // "track remaining balances".
        // Re-reading: "add any remaining balances of customers then it will proper track remaining balances"
        // Usually this means "Credit Sale" i.e. Customer took fuel but didn't pay.
        // So "Amount He Paid" ?? Maybe "Amount He OWES"?
        // Or "Amount He Paid" means "Partial Payment"?
        // Prompt: "enter customer name, phone num and how many amount he paid like you can see this functionality in checkout page"
        // Checkout page usually tracks what they *paid*.
        // If I sell 1000 worth.
        // Customer A takes 500 worth, pays 0. (Balance 500).
        // Customer B takes 500 worth, pays 200. (Balance 300).
        // Cash in hand = 200.
        // Total Sale = 1000.
        // The user prompt is slightly ambiguous: "how many amount he paid".
        // If I enter "Amount He Paid", how do I know the "Total Amount He Bought"? 
        // Ah, maybe the user means "Amount He Bought on Credit"?
        // "add any remaining balances... track remaining balances".
        // If I enter "Amount Paid", I don't know the generated debt unless I know the individual sale amount.
        // BUT, we are doing *Nozzle* sales. 100 people came.
        // We know Total Sales = 1000 Liters = 100,000 RS.
        // We don't know individual breakdown per customer generally.
        // BUT we want to record "Credit Customers".
        // So we say: "Out of this 100,000 RS, Ali took 5000 RS worth and didn't pay".
        // So we record "Ali: 5000 Debt".
        // So the field likely means "Amount of Credit" or "Amount to add to Balance".

        // user phrase: "how many amount he paid".
        // This is confusing. If he paid, why add to remaining balance?
        // Maybe "Amount he *is to pay*" (i.e. Credit)?
        // "remaining balances of any users ... track remaining balances".
        // I will assume this list represents **CREDIT SALES** (money *not* received).
        // So "amount" in `creditSales` array = Amount to be added to user's debt.
    }

    // 1. Create Main Sale Record (Cash + Credits aggregated?)
    // Actually, distinct records are better for tracking.
    // "dont add whole sales separatey and will directly tell total fuel saled"
    // So one big record for the nozzle logic?

    // Let's create one SALE record for the day/nozzle.
    // Payment Method: "Cash" (mostly).
    // And if there are credits, we might need separate records or a way to link them?
    // If we create one big Sale, we can't easily tag "Ali" to 500 RS of it.
    // UNLESS we just create simple "Debt" records for Ali?
    // But `Sale` model has `paymentStatus`.

    // Strategy:
    // Create one Sale for the *Cash* portion.
    // Create separate Sales for each *Credit* customer.
    // Sum of (Cash Sale + Credit Sales) MUST = Total Nozzle Sale?
    // Not necessarily. The "Credit Sales" might be just a subset.
    // What about the "Cash" customers? We don't track them individually.
    // So:
    // Total Expected = soldQuantity * rate.
    // Credit Total = Sum(creditSales.amount).
    // Cash Total = Total Expected - Credit Total.

    // So I will create:
    // 1. Sale (Cash): Amount = Cash Total. Items = { product: Fuel, quantity: (CashTotal/Rate) }.
    // 2. Sales (Credit): For each credit customer. Amount = creditSale.amount. Items = { quantity: creditSale.amount/rate }.
    //    These will have `paymentStatus = "Partial"` (or "Unpaid" if supported, but enum has "Paid", "Partial", "Overpaid").
    //    Actually "Partial" with `amountPaid: 0` is effectively Unpaid.

    // 1. Stock Deduction with Cost Calculation
    let remainingToDeduct = soldQuantity;
    let totalCost = 0; // Track total purchase cost of sold fuel

    const stocks = await Stock.find({ fuelType: nozzle.fuelType, quantity: { $gt: 0 } })
        .sort({ purchaseDate: 1 }); // FIFO

    for (const stock of stocks) {
        if (remainingToDeduct <= 0) break;

        const deduct = Math.min(stock.quantity, remainingToDeduct);

        // Accumulate Cost
        // purchasePricePerLiter might be undefined for old records, default to 0 or salePrice?
        // Ideally should be 0 so profit shows up as reduced (or full profit if cost unknown).
        // Let's assume 0 if missing.
        const stockCost = Number(stock.purchasePricePerLiter) || 0;
        totalCost += (deduct * stockCost);

        stock.quantity -= deduct;
        remainingToDeduct -= deduct;
        await stock.save();
    }

    // Calculate Average Cost Rate for this sale
    const averagePurchaseRate = totalCost / soldQuantity;

    // 2. Process Credit Sales
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

        // Create Sale Record for Credit
        const creditLiters = credit.amount / rate;
        await Sale.create({
            employerId,
            pumpId: pump._id, // corrected: use resolved object ID
            customerId: customer._id, // Link to customer
            items: [{
                productName: nozzle.fuelType,
                category: "Fuel",
                quantity: creditLiters,
                unit: "L",
                quantityInLiters: creditLiters,
                rate: rate,
                total: credit.amount,
                purchaseRate: averagePurchaseRate,
                purchaseTotal: creditLiters * averagePurchaseRate,
                nozzleId: nozzleId
            }],
            subtotal: credit.amount,
            tax: 0,
            grandTotal: credit.amount,
            amountPaid: 0, // Unpaid
            changeReturned: 0,
            paymentStatus: "Partial",
            paymentMethod: "Cash", // Or "Credit" if added to Enum
            notes: `Credit Sale - Customer: ${credit.name} (${credit.phone})`,
            status: "Approved",
            paymentHistory: []
        });
    }

    // 3. Process Cash Sale (Remaining)
    if (cashAmount > 0) {
        const cashLiters = cashAmount / rate;
        await Sale.create({
            employerId,
            pumpId: pump._id, // corrected: use resolved object ID
            items: [{
                productName: nozzle.fuelType,
                category: "Fuel",
                quantity: cashLiters,
                unit: "L",
                quantityInLiters: cashLiters,
                rate: rate,
                total: cashAmount,
                purchaseRate: averagePurchaseRate,
                purchaseTotal: cashLiters * averagePurchaseRate,
                nozzleId: nozzleId
            }],
            subtotal: cashAmount,
            tax: 0,
            grandTotal: cashAmount,
            amountPaid: cashAmount,
            changeReturned: 0,
            paymentStatus: "Paid",
            paymentMethod: "Cash",
            notes: "Daily Nozzle Cash Sale",
            status: "Approved",
            paymentHistory: [{
                action: "Initial Sale",
                amount: cashAmount,
                paymentMethod: "Cash",
                performedBy: "Employer", // Ideally fetch name
                timestamp: new Date()
            }]
        });
    }

    // 4. Update Nozzle
    nozzle.openingReading = closingReading;
    await pump.save();

    revalidatePath(`/employer/${pumpId}/nozzles`);
    return { success: true, message: "Daily sale recorded successfully" };
}
