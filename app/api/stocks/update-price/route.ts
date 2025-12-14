import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/models/Stock";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { fuelType, newSalePrice } = body;

        if (!fuelType || newSalePrice === undefined) {
            return NextResponse.json(
                { error: "fuelType and newSalePrice are required" },
                { status: 400 }
            );
        }

        const price = Number(newSalePrice);
        if (isNaN(price) || price < 0) {
            return NextResponse.json(
                { error: "newSalePrice must be a positive number" },
                { status: 400 }
            );
        }

        await connectDB();

        // Update all stocks of the given fuel type
        const result = await Stock.updateMany(
            { fuelType: fuelType },
            { $set: { salePricePerLiter: price } }
        );

        return NextResponse.json({
            message: "Prices updated successfully",
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });

    } catch (error: unknown) {
        console.error("Error updating stock prices:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update stock prices" },
            { status: 500 }
        );
    }
}
