"use server";

import connectDB from "@/lib/db";
import Stock from "@/models/Stock";

interface Product {
    name: string;
    category: string;
    rate: number;
    unit: "L" | "mL" | "pcs";
    defaultUnit: "L" | "mL" | "pcs";
    totalQuantity: number;
}

export async function getPumpStocks(pumpName: string): Promise<Product[]> {
    try {
        await connectDB();

        // Ensure pumpName is provided and decoded if coming from URL
        const decodedPumpName = decodeURIComponent(pumpName);

        // Fetch all stocks for the given pump
        const stocks = await Stock.find({ pump: decodedPumpName });

        if (!stocks || stocks.length === 0) {
            return [];
        }

        // Group by fuelType
        const stockMap = new Map<string, {
            totalQuantity: number;
            salePrice: number;
            updatedAt: Date;
        }>();

        stocks.forEach(stock => {
            const current = stockMap.get(stock.fuelType);

            // We want the latest sale price, so we track update time
            // Or we could average it, but usually the latest add/edit reflects current price. 
            // However, different batches might have different prices. 
            // For now, let's take the salePrice from the most recently updated stock entry 
            // OR if the requirement implies a single global price, we might need a different approach.
            // Given the prompt: "fetch the setted sale price of that category stock"

            if (!current) {
                stockMap.set(stock.fuelType, {
                    totalQuantity: stock.quantity,
                    salePrice: stock.salePricePerLiter,
                    updatedAt: new Date(stock.updatedAt)
                });
            } else {
                current.totalQuantity += stock.quantity;
                // Update price if this stock entry is newer
                if (new Date(stock.updatedAt) > current.updatedAt) {
                    current.salePrice = stock.salePricePerLiter;
                    current.updatedAt = new Date(stock.updatedAt);
                }
            }
        });

        // Convert map to Product array
        const products: Product[] = [];
        stockMap.forEach((data, fuelType) => {
            // Determine unit based on fuel type (simplified logic, can be expanded)
            // Assuming most fuels are Liter based.
            // If there's a specific logic for pieces/mL, it should be added here.

            products.push({
                name: fuelType,
                category: fuelType, // Using fuelType as category for now
                rate: data.salePrice,
                unit: "L", // Defaulting to L for fuel
                defaultUnit: "L",
                totalQuantity: data.totalQuantity
            });
        });

        return products;

    } catch (error) {
        console.error("Error fetching pump stocks:", error);
        return [];
    }
}
