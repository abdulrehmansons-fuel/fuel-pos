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

        // Group by fuelType or Lube Identity
        const stockMap = new Map<string, {
            totalQuantity: number;
            salePrice: number;
            updatedAt: Date;
            isLubricant: boolean;
            unitVolume?: number;
            lubeName?: string;
        }>();

        stocks.forEach(stock => {
            let key = stock.fuelType;
            let isLubricant = false;

            if (stock.fuelType === 'Lubricants' && stock.lubeName && stock.unitVolume) {
                key = `${stock.lubeName} (${stock.unitVolume}L)`;
                isLubricant = true;
            }

            const current = stockMap.get(key);

            if (!current) {
                stockMap.set(key, {
                    totalQuantity: stock.quantity,
                    salePrice: stock.salePricePerLiter,
                    updatedAt: new Date(stock.updatedAt),
                    isLubricant,
                    unitVolume: stock.unitVolume,
                    lubeName: stock.lubeName
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
        stockMap.forEach((data, key) => {
            let rate = data.salePrice;
            let quantity = data.totalQuantity;
            let unit: "L" | "mL" | "pcs" = "L";

            if (data.isLubricant && data.unitVolume) {
                // Convert Rate Per Liter -> Rate Per Pack
                rate = data.salePrice * data.unitVolume;
                // Convert Total Liters -> Total Packs
                quantity = Math.floor(data.totalQuantity / data.unitVolume); // Packs should be integers? Or allow decimals?
                // Actually stock might be fractional if we sold partial? But sales are usually whole.
                // stock.quantity stored actual liters. 
                // Let's allow decimal packs just in case, but usually integers.
                quantity = Number((data.totalQuantity / data.unitVolume).toFixed(2));
                unit = "pcs";
            }

            products.push({
                name: key,
                category: data.isLubricant ? 'Lubricants' : key,
                rate: Number(rate.toFixed(2)),
                unit: unit,
                defaultUnit: unit,
                totalQuantity: quantity
            });
        });

        return products;

    } catch (error) {
        console.error("Error fetching pump stocks:", error);
        return [];
    }
}
